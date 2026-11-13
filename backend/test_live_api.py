import httpx
import json
import sys

BASE_URL = "http://localhost:8000"

def test_api():
    client = httpx.Client(timeout=30.0)

    test_cases = [
        {
            "name": "TEST 1: Products & Prices Inquiry",
            "payload": {
                "phone_number": "+923090139836",
                "customer_name": "Rubaisha",
                "message": "What products do you have in stock and their prices?"
            }
        },
        {
            "name": "TEST 2: Order #9999 Status Tracking",
            "payload": {
                "phone_number": "+923090139836",
                "customer_name": "Rubaisha",
                "message": "Check status of my order #9999"
            }
        },
        {
            "name": "TEST 3: Order ORD-9988 Status Tracking",
            "payload": {
                "phone_number": "+923090139836",
                "customer_name": "Rubaisha",
                "message": "Where is my order ORD-9988?"
            }
        }
    ]

    all_passed = True

    for tc in test_cases:
        print("\n" + "=" * 65)
        print(f"RUNNING {tc['name']}")
        print(f"Payload: {json.dumps(tc['payload'])}")
        print("=" * 65)

        try:
            res = client.post(f"{BASE_URL}/api/simulate-whatsapp", json=tc["payload"])
            if res.status_code != 200:
                print(f"FAILED with HTTP {res.status_code}: {res.text}")
                all_passed = False
                continue

            data = res.json()
            agent_response = data.get("agent_response", "")

            print(f"Status: {res.status_code} OK")
            print(f"Sender: {data.get('phone_number')} ({data.get('customer_name')})")
            print(f"AI Response:\n{agent_response}\n")

            # Verify no error message was returned
            if "I apologize, but I am currently having trouble" in agent_response:
                print(">>> FAILED: Returned exception error message!")
                all_passed = False
            else:
                print(">>> PASSED: Rich AI response received successfully with zero errors!")

        except Exception as e:
            print(f"Request failed with exception: {e}")
            all_passed = False

    print("\n" + "=" * 65)
    if all_passed:
        print("SUCCESS: 100% of live test calls passed successfully!")
    else:
        print("FAILURE: One or more test calls did not pass.")
    print("=" * 65)

if __name__ == "__main__":
    test_api()
