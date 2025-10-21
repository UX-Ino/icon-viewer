from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)

@app.route('/scan', methods=['POST'])
def scan_icons_route():
    try:
        # Get the absolute path to the scan.py script
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scan.py')
        
        # Run the scan.py script
        result = subprocess.run(['python', script_path], capture_output=True, text=True, check=True)
        
        return jsonify({'message': 'Scan completed successfully', 'output': result.stdout})
    except subprocess.CalledProcessError as e:
        return jsonify({'message': 'Scan failed', 'error': e.stderr}), 500
    except Exception as e:
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
