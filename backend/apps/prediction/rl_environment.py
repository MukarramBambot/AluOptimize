"""
Reinforcement Learning Environment for Aluminum Production Optimization

Inspired by IBM's RL Testbed for EnergyPlus, this module implements a 
state-action-reward structure for optimizing aluminum production processes.

State: Current production parameters (feed_rate, temperature, pressure, etc.)
Action: Suggested adjustments to production parameters
Reward: Efficiency gain minus waste penalty

This is currently a rule-based system that can be extended to full RL in the future.
"""

import logging
from typing import Dict, Tuple, Optional
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)


@dataclass
class ProductionState:
    """Represents the current state of the production system."""
    feed_rate: float
    temperature: float
    pressure: float
    power_consumption: float
    bath_ratio: float
    alumina_concentration: float
    anode_effect: float
    production_line: str
    
    def to_dict(self) -> Dict:
        """Convert state to dictionary for storage."""
        return {
            'feed_rate': self.feed_rate,
            'temperature': self.temperature,
            'pressure': self.pressure,
            'power_consumption': self.power_consumption,
            'bath_ratio': self.bath_ratio,
            'alumina_concentration': self.alumina_concentration,
            'anode_effect': self.anode_effect,
            'production_line': self.production_line,
        }


@dataclass
class ProductionAction:
    """Represents suggested actions to optimize production."""
    adjust_feed_rate: float  # Percentage adjustment (-100 to +100)
    adjust_power: float      # Percentage adjustment (-100 to +100)
    adjust_temperature: float  # Absolute adjustment in Celsius
    adjust_bath_ratio: float   # Absolute adjustment
    reasoning: str  # Explanation for the suggested actions
    
    def to_dict(self) -> Dict:
        """Convert action to dictionary for storage."""
        return {
            'adjust_feed_rate': self.adjust_feed_rate,
            'adjust_power': self.adjust_power,
            'adjust_temperature': self.adjust_temperature,
            'adjust_bath_ratio': self.adjust_bath_ratio,
            'reasoning': self.reasoning,
        }


@dataclass
class ProductionReward:
    """Represents the reward signal for the RL environment."""
    efficiency_score: float
    waste_penalty: float
    total_reward: float
    quality_bonus: float
    
    def to_dict(self) -> Dict:
        """Convert reward to dictionary for storage."""
        return {
            'efficiency_score': self.efficiency_score,
            'waste_penalty': self.waste_penalty,
            'quality_bonus': self.quality_bonus,
            'total_reward': self.total_reward,
        }


class AluminumProductionEnvironment:
    """
    RL Environment for Aluminum Production Optimization.
    
    This environment simulates the aluminum production process and provides
    state-action-reward feedback for optimization.
    """
    
    # Constants for reward calculation
    WASTE_PENALTY_FACTOR = 0.5  # Penalty per kg of waste
    QUALITY_BONUS_FACTOR = 0.1  # Bonus for high quality output
    EFFICIENCY_WEIGHT = 1.0     # Weight for efficiency in reward
    
    # Thresholds for action suggestions
    LOW_EFFICIENCY_THRESHOLD = 40.0
    MODERATE_EFFICIENCY_THRESHOLD = 60.0
    HIGH_EFFICIENCY_THRESHOLD = 80.0
    
    HIGH_WASTE_THRESHOLD = 50.0
    MODERATE_WASTE_THRESHOLD = 10.0
    
    def __init__(self):
        """Initialize the RL environment."""
        self.logger = logging.getLogger(__name__)
    
    def create_state(self, production_input) -> ProductionState:
        """
        Create a state representation from production input.
        
        Args:
            production_input: ProductionInput model instance
            
        Returns:
            ProductionState object
        """
        return ProductionState(
            feed_rate=production_input.feed_rate,
            temperature=production_input.temperature,
            pressure=production_input.pressure,
            power_consumption=production_input.power_consumption,
            bath_ratio=production_input.bath_ratio,
            alumina_concentration=production_input.alumina_concentration,
            anode_effect=production_input.anode_effect,
            production_line=production_input.production_line,
        )
    
    def predict_output(self, state: ProductionState) -> Tuple[float, float, float]:
        """
        Predict production output based on current state.
        
        This is a simplified rule-based prediction. In the future, this can be
        replaced with a trained ML model or RL agent.
        
        Args:
            state: Current production state
            
        Returns:
            Tuple of (predicted_output, energy_efficiency, output_quality)
        """
        # Base conversion rate: 85% of feed rate becomes output
        base_conversion = 0.85
        
        # Adjust conversion based on temperature (optimal: 950-970°C)
        temp_factor = 1.0
        if state.temperature < 930:
            temp_factor = 0.90  # Too cold, reduced efficiency
        elif state.temperature > 980:
            temp_factor = 0.92  # Too hot, some material loss
        elif 950 <= state.temperature <= 970:
            temp_factor = 1.05  # Optimal temperature range
        
        # Adjust based on bath ratio (optimal: 1.2-1.4)
        bath_factor = 1.0
        if 1.2 <= state.bath_ratio <= 1.4:
            bath_factor = 1.03  # Optimal bath ratio
        elif state.bath_ratio < 1.0 or state.bath_ratio > 1.6:
            bath_factor = 0.95  # Suboptimal bath ratio
        
        # Calculate predicted output
        predicted_output = state.feed_rate * base_conversion * temp_factor * bath_factor
        
        # Calculate energy efficiency (output per unit energy)
        energy_efficiency = (state.feed_rate / state.power_consumption) * 100
        
        # Calculate output quality based on process parameters
        quality_score = min(100, (state.temperature / 10) + (state.bath_ratio * 20))
        
        return predicted_output, energy_efficiency, quality_score
    
    def calculate_reward(
        self, 
        state: ProductionState, 
        predicted_output: float,
        energy_efficiency: float,
        output_quality: float
    ) -> ProductionReward:
        """
        Calculate reward signal based on production outcome.
        
        Reward = Efficiency Score - Waste Penalty + Quality Bonus
        
        Args:
            state: Current production state
            predicted_output: Predicted output amount
            energy_efficiency: Energy efficiency percentage
            output_quality: Output quality score
            
        Returns:
            ProductionReward object
        """
        # Calculate waste
        waste_amount = max(0, state.feed_rate - predicted_output)
        
        # Efficiency score (normalized to 0-100)
        efficiency_score = energy_efficiency * self.EFFICIENCY_WEIGHT
        
        # Waste penalty (higher waste = higher penalty)
        waste_penalty = waste_amount * self.WASTE_PENALTY_FACTOR
        
        # Quality bonus (reward high quality output)
        quality_bonus = (output_quality / 100) * self.QUALITY_BONUS_FACTOR * state.feed_rate
        
        # Total reward
        total_reward = efficiency_score - waste_penalty + quality_bonus
        
        return ProductionReward(
            efficiency_score=efficiency_score,
            waste_penalty=waste_penalty,
            quality_bonus=quality_bonus,
            total_reward=total_reward,
        )
    
    def suggest_action(
        self, 
        state: ProductionState,
        energy_efficiency: float,
        waste_amount: float
    ) -> ProductionAction:
        """
        Suggest optimization actions based on current state and performance.
        
        This is a rule-based policy that can be replaced with an RL agent.
        
        Args:
            state: Current production state
            energy_efficiency: Current energy efficiency
            waste_amount: Current waste amount
            
        Returns:
            ProductionAction object with suggested adjustments
        """
        adjust_feed_rate = 0.0
        adjust_power = 0.0
        adjust_temperature = 0.0
        adjust_bath_ratio = 0.0
        reasoning_parts = []
        
        # High waste scenario
        if waste_amount > self.HIGH_WASTE_THRESHOLD:
            adjust_feed_rate = -5.0  # Reduce feed rate by 5%
            reasoning_parts.append(
                f"High waste detected ({waste_amount:.1f} kg). "
                "Reduce feed rate by 5% to improve conversion efficiency."
            )
        elif waste_amount > self.MODERATE_WASTE_THRESHOLD:
            adjust_feed_rate = -2.0  # Reduce feed rate by 2%
            reasoning_parts.append(
                f"Moderate waste ({waste_amount:.1f} kg). "
                "Fine-tune feed rate by reducing 2%."
            )
        
        # Low efficiency scenario
        if energy_efficiency < self.LOW_EFFICIENCY_THRESHOLD:
            adjust_power = -10.0  # Reduce power by 10%
            reasoning_parts.append(
                f"Low efficiency ({energy_efficiency:.1f}%). "
                "Reduce power consumption by 10% to improve energy efficiency."
            )
        elif energy_efficiency < self.MODERATE_EFFICIENCY_THRESHOLD:
            adjust_power = -5.0  # Reduce power by 5%
            reasoning_parts.append(
                f"Moderate efficiency ({energy_efficiency:.1f}%). "
                "Optimize power consumption by reducing 5%."
            )
        
        # Temperature optimization
        if state.temperature < 950:
            adjust_temperature = 10.0  # Increase temperature
            reasoning_parts.append(
                f"Temperature too low ({state.temperature:.1f}°C). "
                "Increase by 10°C to reach optimal range (950-970°C)."
            )
        elif state.temperature > 970:
            adjust_temperature = -10.0  # Decrease temperature
            reasoning_parts.append(
                f"Temperature too high ({state.temperature:.1f}°C). "
                "Decrease by 10°C to reach optimal range (950-970°C)."
            )
        
        # Bath ratio optimization
        if state.bath_ratio < 1.2:
            adjust_bath_ratio = 0.1
            reasoning_parts.append(
                f"Bath ratio low ({state.bath_ratio:.2f}). "
                "Increase by 0.1 to reach optimal range (1.2-1.4)."
            )
        elif state.bath_ratio > 1.4:
            adjust_bath_ratio = -0.1
            reasoning_parts.append(
                f"Bath ratio high ({state.bath_ratio:.2f}). "
                "Decrease by 0.1 to reach optimal range (1.2-1.4)."
            )
        
        # If everything is optimal
        if not reasoning_parts:
            reasoning_parts.append(
                f"System operating optimally (Efficiency: {energy_efficiency:.1f}%, "
                f"Waste: {waste_amount:.1f} kg). Maintain current parameters."
            )
        
        reasoning = " ".join(reasoning_parts)
        
        return ProductionAction(
            adjust_feed_rate=adjust_feed_rate,
            adjust_power=adjust_power,
            adjust_temperature=adjust_temperature,
            adjust_bath_ratio=adjust_bath_ratio,
            reasoning=reasoning,
        )
    
    def step(self, production_input) -> Dict:
        """
        Execute one step of the RL environment.
        
        This is the main interface for running predictions with RL feedback.
        
        Args:
            production_input: ProductionInput model instance
            
        Returns:
            Dictionary containing state, action, reward, and predictions
        """
        # Create state from input
        state = self.create_state(production_input)
        
        # Predict output
        predicted_output, energy_efficiency, output_quality = self.predict_output(state)
        
        # Calculate waste
        waste_amount = max(0, state.feed_rate - predicted_output)
        
        # Calculate reward
        reward = self.calculate_reward(state, predicted_output, energy_efficiency, output_quality)
        
        # Suggest actions for next iteration
        action = self.suggest_action(state, energy_efficiency, waste_amount)
        
        # Log the step
        self.logger.info(
            f"RL Step - Line: {state.production_line}, "
            f"Efficiency: {energy_efficiency:.1f}%, "
            f"Waste: {waste_amount:.1f} kg, "
            f"Reward: {reward.total_reward:.2f}"
        )
        
        return {
            'state': state.to_dict(),
            'action': action.to_dict(),
            'reward': reward.to_dict(),
            'predicted_output': predicted_output,
            'energy_efficiency': energy_efficiency,
            'output_quality': output_quality,
            'waste_amount': waste_amount,
        }
    
    def generate_recommendation_text(
        self, 
        waste_amount: float,
        energy_efficiency: float,
        action: ProductionAction
    ) -> str:
        """
        Generate human-readable recommendation text.
        
        Args:
            waste_amount: Amount of waste generated
            energy_efficiency: Energy efficiency percentage
            action: Suggested action
            
        Returns:
            Recommendation text string
        """
        if waste_amount > self.HIGH_WASTE_THRESHOLD:
            severity = "⚠️ High waste detected"
        elif waste_amount > self.MODERATE_WASTE_THRESHOLD:
            severity = "⚙️ Moderate waste observed"
        else:
            severity = "✅ System efficiency optimal"
        
        recommendation = (
            f"{severity}\n\n"
            f"Current Performance:\n"
            f"• Energy Efficiency: {energy_efficiency:.1f}%\n"
            f"• Waste Generated: {waste_amount:.1f} kg\n\n"
            f"AI Recommendation:\n"
            f"{action.reasoning}\n\n"
            f"Suggested Adjustments:\n"
        )
        
        if action.adjust_feed_rate != 0:
            recommendation += f"• Feed Rate: {action.adjust_feed_rate:+.1f}%\n"
        if action.adjust_power != 0:
            recommendation += f"• Power Consumption: {action.adjust_power:+.1f}%\n"
        if action.adjust_temperature != 0:
            recommendation += f"• Temperature: {action.adjust_temperature:+.1f}°C\n"
        if action.adjust_bath_ratio != 0:
            recommendation += f"• Bath Ratio: {action.adjust_bath_ratio:+.2f}\n"
        
        if all([
            action.adjust_feed_rate == 0,
            action.adjust_power == 0,
            action.adjust_temperature == 0,
            action.adjust_bath_ratio == 0
        ]):
            recommendation += "• No adjustments needed - maintain current parameters\n"
        
        recommendation += "\n(AI-generated approximate values based on production input)"
        
        return recommendation
