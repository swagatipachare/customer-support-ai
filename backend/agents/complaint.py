import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from base_agent import answer_with_context

def handle(user_message):
    role = "You are a complaints and escalation agent for TechMart Electronics. Be empathetic, acknowledge frustration, and offer to escalate if needed."
    return answer_with_context(user_message, role)