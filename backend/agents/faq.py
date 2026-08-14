import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from base_agent import answer_with_context

def handle(user_message):
    role = "You are a general FAQ agent for TechMart Electronics. You handle company policies and general questions."
    return answer_with_context(user_message, role)