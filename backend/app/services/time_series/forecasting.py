import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.ensemble import RandomForestRegressor
from typing import Dict, List, Any, Tuple
from datetime import datetime, timedelta
import json

class SLAForecaster:
    """
    Forecast SLA violations using time-series analysis.
    """
    
    def __init__(self):
        self.models = {}
        
    def prepare_sla_data(self, events: List[Dict]) -> pd.DataFrame:
        """Prepare SLA event data for forecasting"""
        df = pd.DataFrame(events)
        
        if len(df) == 0:
            return pd.DataFrame()
        
        # Convert to time series
        df['event_date'] = pd.to_datetime(df['event_date'])
        df.set_index('event_date', inplace=True)
        
        # Resample to daily frequency
        daily_violations = df[df['event_type'] == 'violation'].resample('D').size()
        daily_violations = daily_violations.reindex(
            pd.date_range(start=daily_violations.index.min(),
                         end=daily_violations.index.max(),
                         freq='D'),
            fill_value=0
        )
        
        return daily_violations.to_frame(name='violations').reset_index()
    
    def forecast_violations_prophet(self, 
                                   sla_data: pd.DataFrame,
                                   periods: int = 30) -> Dict[str, Any]:
        """
        Forecast future SLA violations using Facebook's Prophet.
        """
        if len(sla_data) < 14:  # Need at least 2 weeks of data
            return self._fallback_forecast(periods)
        
        # Prepare data for Prophet
        df = sla_data.copy()
        df.columns = ['ds', 'y']
        
        # Create and fit model
        model = Prophet(
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=True,
            changepoint_prior_scale=0.05
        )
        
        model.fit(df)
        
        # Make future dataframe
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)
        
        # Extract forecast
        forecast_df = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
        
        # Convert to dict
        predictions = []
        for _, row in forecast_df.iterrows():
            predictions.append({
                'date': row['ds'].strftime('%Y-%m-%d'),
                'predicted_violations': max(0, row['yhat']),
                'lower_bound': max(0, row['yhat_lower']),
                'upper_bound': max(0, row['yhat_upper']),
                'confidence': 'high' if (row['yhat_upper'] - row['yhat_lower']) < 2 else 'medium'
            })
        
        # Calculate risk level
        avg_prediction = forecast_df['yhat'].mean()
        risk_level = "HIGH" if avg_prediction > 1 else "MEDIUM" if avg_prediction > 0.5 else "LOW"
        
        return {
            'model': 'prophet',
            'forecast_periods': periods,
            'predictions': predictions,
            'risk_level': risk_level,
            'avg_predicted_violations': float(avg_prediction),
            'trend': 'increasing' if forecast_df['yhat'].iloc[-1] > forecast_df['yhat'].iloc[0] else 'decreasing'
        }
    
    def forecast_vendor_reliability(self, 
                                   performance_data: List[Dict],
                                   forecast_days: int = 90) -> Dict[str, Any]:
        """
        Forecast vendor reliability scores.
        """
        if len(performance_data) < 4:  # Need at least 4 data points
            return self._fallback_vendor_forecast(performance_data, forecast_days)
        
        df = pd.DataFrame(performance_data)
        df['period_end'] = pd.to_datetime(df['period_end'])
        df = df.sort_values('period_end')
        
        # Use simple linear regression for trend
        x = np.arange(len(df))
        y = df['overall_score'].values
        
        # Fit linear model
        coeffs = np.polyfit(x, y, 1)
        slope = coeffs[0]  # Daily change
        
        # Predict future
        last_date = df['period_end'].iloc[-1]
        future_dates = [last_date + timedelta(days=i) for i in range(1, forecast_days + 1)]
        
        predictions = []
        current_score = df['overall_score'].iloc[-1]
        
        for i, date in enumerate(future_dates):
            predicted_score = current_score + (slope * (i + 1))
            predicted_score = max(0, min(100, predicted_score))  # Clamp to 0-100
            
            reliability = "HIGH" if predicted_score > 80 else "MEDIUM" if predicted_score > 60 else "LOW"
            
            predictions.append({
                'date': date.strftime('%Y-%m-%d'),
                'predicted_score': float(predicted_score),
                'reliability': reliability,
                'trend': 'improving' if slope > 0.1 else 'declining' if slope < -0.1 else 'stable'
            })
        
        return {
            'model': 'linear_trend',
            'forecast_days': forecast_days,
            'predictions': predictions[-30:],  # Last 30 days
            'current_score': float(df['overall_score'].iloc[-1]),
            'trend_slope': float(slope),
            'recommendation': self._get_vendor_recommendation(slope, current_score)
        }
    
    def _fallback_forecast(self, periods: int) -> Dict[str, Any]:
        """Fallback when insufficient data"""
        predictions = []
        today = datetime.now()
        
        for i in range(periods):
            date = today + timedelta(days=i)
            predictions.append({
                'date': date.strftime('%Y-%m-%d'),
                'predicted_violations': 0.0,
                'lower_bound': 0.0,
                'upper_bound': 0.5,
                'confidence': 'low',
                'note': 'Insufficient historical data'
            })
        
        return {
            'model': 'fallback',
            'forecast_periods': periods,
            'predictions': predictions,
            'risk_level': 'UNKNOWN',
            'avg_predicted_violations': 0.0,
            'trend': 'unknown',
            'warning': 'Insufficient data for accurate forecasting'
        }
    
    def _fallback_vendor_forecast(self, 
                                 performance_data: List[Dict],
                                 forecast_days: int) -> Dict[str, Any]:
        """Fallback vendor forecast"""
        if performance_data:
            last_score = performance_data[-1].get('overall_score', 70)
        else:
            last_score = 70
        
        return {
            'model': 'fallback',
            'forecast_days': forecast_days,
            'predictions': [],
            'current_score': float(last_score),
            'trend_slope': 0.0,
            'recommendation': 'Collect more performance data',
            'warning': 'Insufficient historical data'
        }
    
    def _get_vendor_recommendation(self, slope: float, current_score: float) -> str:
        """Generate vendor recommendation based on trend and score"""
        if current_score > 85:
            if slope > 0.1:
                return "EXCELLENT - Continue partnership"
            else:
                return "GOOD - Monitor for changes"
        elif current_score > 70:
            if slope > 0.2:
                return "IMPROVING - Positive trend"
            elif slope < -0.2:
                return "CONCERN - Declining performance"
            else:
                return "STABLE - Regular review needed"
        else:
            if slope < -0.3:
                return "CRITICAL - Consider termination"
            else:
                return "POOR - Needs improvement plan"
    
    def detect_anomalies(self, 
                        performance_data: List[Dict],
                        threshold_std: float = 2.0) -> List[Dict[str, Any]]:
        """
        Detect anomalies in performance data.
        """
        if len(performance_data) < 5:
            return []
        
        df = pd.DataFrame(performance_data)
        scores = df['overall_score'].values
        
        # Calculate moving average and std
        window = min(5, len(scores))
        moving_avg = pd.Series(scores).rolling(window=window, center=True).mean()
        moving_std = pd.Series(scores).rolling(window=window, center=True).std()
        
        anomalies = []
        for i in range(len(scores)):
            if not np.isnan(moving_avg.iloc[i]) and not np.isnan(moving_std.iloc[i]):
                if moving_std.iloc[i] > 0:
                    z_score = abs(scores[i] - moving_avg.iloc[i]) / moving_std.iloc[i]
                    if z_score > threshold_std:
                        anomalies.append({
                            'index': i,
                            'date': df.iloc[i]['period_end'] if 'period_end' in df.columns else None,
                            'score': float(scores[i]),
                            'expected_range': (
                                float(moving_avg.iloc[i] - threshold_std * moving_std.iloc[i]),
                                float(moving_avg.iloc[i] + threshold_std * moving_std.iloc[i])
                            ),
                            'z_score': float(z_score),
                            'severity': 'high' if z_score > 3 else 'medium'
                        })
        
        return anomalies