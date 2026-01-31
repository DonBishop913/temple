import os

def get_stripe_config():
  return {
    'publishable_key': os.environ.get('STRIPE_PUBLISHABLE_KEY'),
    'secret_key': os.environ.get('STRIPE_API_KEY'),
    'webhook_secret': os.environ.get('STRIPE_WEBHOOK_SECRET')
  }

if __name__ == '__main__':
  cfg = get_stripe_config()
  print('Stripe config loaded. publishable_key=', cfg.get('publishable_key') and ('***' + cfg.get('publishable_key')[-6:]) )
