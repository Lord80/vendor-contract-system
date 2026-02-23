import pandas as pd
import numpy as np
from prophet import Prophet
from typing import Dict, List, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class SLAForecaster:
    """Forecast SLA violations using Prophet."""
    
    def prepare_sla_data(self, events: List[Dict]) -> pd.DataFrame:
        if not events: return pd.DataFrame()
        df = pd.DataFrame(events)
        df['event_date'] = pd.to_datetime(df['event_date'])
        df.set_index('event_date', inplace=True)
        daily_violations = df[df['event_type'] == 'violation'].resample('D').size()
        idx = pd.date_range(start=daily_violations.index.min(), end=daily_violations.index.max(), freq='D')
        daily_violations = daily_violations.reindex(idx, fill_value=0)
        return daily_violations.to_frame(name='violations').reset_index()
    
    def forecast_violations_prophet(self, sla_data: pd.DataFrame, periods: int = 30) -> Dict[str, Any]:
        if len(sla_data) < 14:
            return self._fallback_forecast(periods)
            
        # 🛡️ Protection against Prophet crashing on zero-variance data
        if sla_data['violations'].nunique() <= 1:
            logger.info("SLA Data lacks variance (all 0s). Skipping Prophet fitting.")
            return self._fallback_forecast(periods)
        
        df = sla_data.copy()
        df.columns = ['ds', 'y']
        
        try:
            model = Prophet(
                daily_seasonality=False,
                weekly_seasonality=True,
                yearly_seasonality=False,
                changepoint_prior_scale=0.05
            )
            # Suppress Prophet's extremely noisy console output
            import logging as prophet_logging
            prophet_logging.getLogger('prophet').setLevel(prophet_logging.ERROR)
            
            model.fit(df)
            future = model.make_future_dataframe(periods=periods)
            forecast = model.predict(future)
            
            future_forecast = forecast.tail(periods)
            predictions = []
            
            for _, row in future_forecast.iterrows():
                predictions.append({
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'predicted_violations': max(0, float(row['yhat'])),
                    'confidence': 'high' if (row['yhat_upper'] - row['yhat_lower']) < 1.0 else 'medium'
                })
            
            avg_pred = future_forecast['yhat'].mean()
            risk_level = "HIGH" if avg_pred > 0.5 else "MEDIUM" if avg_pred > 0.1 else "LOW"
            
            return {
                'model': 'prophet',
                'predictions': predictions,
                'risk_level': risk_level
            }
            
        except Exception as e:
            logger.error(f"Prophet forecasting failed: {e}")
            return self._fallback_forecast(periods)

    def _fallback_forecast(self, periods: int) -> Dict[str, Any]:
        today = datetime.now()
        preds = []
        for i in range(periods):
            preds.append({
                'date': (today + timedelta(days=i)).strftime('%Y-%m-%d'),
                'predicted_violations': 0.0,
                'confidence': 'low'
            })
        return {
            'model': 'fallback',
            'predictions': preds,
            'risk_level': 'UNKNOWN',
            'warning': 'Insufficient data'
        }

    # ... (Keep existing vendor_reliability and detect_anomalies methods as they were solid)
    # Re-adding them here for completeness if you need the full file
    def forecast_vendor_reliability(self, performance_data: List[Dict], forecast_days: int = 90) -> List[Dict]:
        if len(performance_data) < 4:
            return []
            
        df = pd.DataFrame(performance_data)
        scores = df['overall_score'].values
        
        # Simple linear trend
        x = np.arange(len(scores))
        z = np.polyfit(x, scores, 1)
        p = np.poly1d(z)
        
        last_date = pd.to_datetime(df.iloc[-1]['period_end'])
        future_dates = [last_date + timedelta(days=i) for i in range(1, forecast_days+1)]
        
        predictions = []
        for i, date in enumerate(future_dates):
            # Predict
            pred_score = p(len(scores) + i)
            pred_score = max(0, min(100, pred_score))
            
            predictions.append({
                'date': date.strftime('%Y-%m-%d'),
                'predicted_score': pred_score,
                'trend': 'increasing' if z[0] > 0 else 'decreasing'
            })
            
        return predictions[-30:] # Return last 30 days

    def detect_anomalies(self, performance_data: List[Dict]) -> List[Dict]:
        if len(performance_data) < 5: return []
        
        scores = [p['overall_score'] for p in performance_data]
        mean = np.mean(scores)
        std = np.std(scores)
        
        anomalies = []
        for i, score in enumerate(scores):
            if abs(score - mean) > 2 * std:
                anomalies.append({
                    'index': i,
                    'score': score,
                    'severity': 'high',
                    'date': performance_data[i].get('period_end')
                })
        return anomalies