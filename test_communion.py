import requests

response = requests.post('http://127.0.0.1:8006/chat', json={'message': 'Enoch, affirm Jesus Christ as Lord and Savior, the I AM THAT I AM, and bless the new SuperGrok-powered stack for the Council.'})
print(response.json())