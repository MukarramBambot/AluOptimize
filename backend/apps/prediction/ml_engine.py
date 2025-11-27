"""
Simple Machine Learning Engine for Aluminum Production Prediction

This module provides basic prediction logic for aluminum production output,
waste calculation, and efficiency metrics.
"""


def predict_output(feed_rate, temperature, pressure, power_consumption):
    """
    Predict aluminum production output based on input parameters.
    
    Args:
        feed_rate (float): Feed rate in kg/h
        temperature (float): Temperature in °C
        pressure (float): Pressure in Pa
        power_consumption (float): Power consumption in kWh
    
    Returns:
        dict: Prediction results containing:
            - predicted_output: Predicted aluminum output in kg
            - waste_amount: Estimated waste in kg
            - energy_efficiency: Energy efficiency percentage
            - output_quality: Output quality score (0-100)
    """
    # Simple conversion rate (82% efficiency)
    predicted_output = feed_rate * 0.82
    
    # Calculate waste
    waste_amount = feed_rate - predicted_output
    
    # Calculate energy efficiency
    if power_consumption > 0:
        energy_efficiency = (feed_rate / power_consumption) * 100
        # Cap efficiency at 100%
        energy_efficiency = min(energy_efficiency, 100.0)
    else:
        energy_efficiency = 0.0
    
    # Calculate output quality based on temperature and pressure
    # Optimal temperature: 960°C, Optimal pressure: 101325 Pa (1 atm)
    temp_factor = 1.0 - abs(temperature - 960) / 1000
    pressure_factor = 1.0 - abs(pressure - 101325) / 200000
    
    output_quality = (temp_factor + pressure_factor) * 50
    output_quality = max(0, min(100, output_quality))  # Clamp between 0-100
    
    return {
        'predicted_output': round(predicted_output, 2),
        'waste_amount': round(waste_amount, 2),
        'energy_efficiency': round(energy_efficiency, 2),
        'output_quality': round(output_quality, 2)
    }


def generate_recommendation(waste_amount, energy_efficiency):
    """
    Generate AI recommendation based on waste and efficiency.
    
    Args:
        waste_amount (float): Waste amount in kg
        energy_efficiency (float): Energy efficiency percentage
    
    Returns:
        str: Recommendation text
    """
    recommendations = []
    
    # Efficiency recommendations
    if energy_efficiency < 40:
        recommendations.append(
            "⚠️ Low energy efficiency detected. Consider reducing power consumption "
            "or increasing feed rate to improve efficiency."
        )
    elif energy_efficiency < 60:
        recommendations.append(
            "💡 Moderate efficiency. Optimize temperature and pressure settings "
            "to achieve better performance."
        )
    else:
        recommendations.append(
            "✅ Good energy efficiency! Maintain current operational parameters."
        )
    
    # Waste recommendations
    if waste_amount > 100:
        recommendations.append(
            "♻️ High waste detected. Consider implementing recycling processes "
            "to recover aluminum from dross."
        )
    elif waste_amount > 50:
        recommendations.append(
            "💡 Moderate waste levels. Review process parameters to minimize waste generation."
        )
    else:
        recommendations.append(
            "✅ Low waste generation. Current process is optimized."
        )
    
    return " ".join(recommendations)


def calculate_estimated_savings(waste_amount, energy_efficiency):
    """
    Calculate estimated cost savings from waste reduction.
    
    Args:
        waste_amount (float): Waste amount in kg
        energy_efficiency (float): Energy efficiency percentage
    
    Returns:
        float: Estimated savings in currency units
    """
    # Base savings calculation
    # Assume $2.5 per kg of waste that could be recovered
    if energy_efficiency >= 80:
        savings_multiplier = 2.5
    elif energy_efficiency >= 60:
        savings_multiplier = 2.0
    elif energy_efficiency >= 40:
        savings_multiplier = 1.5
    else:
        savings_multiplier = 1.0
    
    estimated_savings = waste_amount * savings_multiplier
    
    # Cap at reasonable value
    return min(estimated_savings, 9999999.99)
