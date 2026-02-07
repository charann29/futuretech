import os
import json
import sys
from pathlib import Path

# Add parent directory to path to import config (Optional fallback)
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
try:
    from config import GROQ_API_KEY
except ImportError:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

from groq import Groq

class LLMClient:
    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not found in environment or config.py")
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model_name = model_name
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.call_count = 0

    def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
        """
        Generate a response from the LLM.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature
            )
            
            # Track token usage
            if hasattr(response, 'usage'):
                self.total_input_tokens += response.usage.prompt_tokens
                self.total_output_tokens += response.usage.completion_tokens
                self.call_count += 1
            
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq Generation Error: {e}")
            raise
    
    def get_usage_stats(self):
        """Return token usage statistics."""
        total_tokens = self.total_input_tokens + self.total_output_tokens
        return {
            "calls": self.call_count,
            "input_tokens": self.total_input_tokens,
            "output_tokens": self.total_output_tokens,
            "total_tokens": total_tokens
        }
    
    def print_usage_stats(self):
        """Print formatted token usage statistics."""
        stats = self.get_usage_stats()
        print("\n" + "="*60)
        print("TOKEN USAGE SUMMARY")
        print("="*60)
        print(f"Total API Calls: {stats['calls']}")
        print(f"Input Tokens:    {stats['input_tokens']:,}")
        print(f"Output Tokens:   {stats['output_tokens']:,}")
        print(f"Total Tokens:    {stats['total_tokens']:,}")
        print(f"\nEstimated Cost (Llama 3.3 70B):")
        # Groq pricing: $0.59 per 1M input tokens, $0.79 per 1M output tokens
        input_cost = (stats['input_tokens'] / 1_000_000) * 0.59
        output_cost = (stats['output_tokens'] / 1_000_000) * 0.79
        total_cost = input_cost + output_cost
        print(f"  Input:  ${input_cost:.4f}")
        print(f"  Output: ${output_cost:.4f}")
        print(f"  Total:  ${total_cost:.4f}")
        print("="*60 + "\n")
