#!/bin/bash

# K6 Load Testing Suite for APM Backend
# Make sure your backend is running before executing these tests

echo "🚀 Starting K6 Load Testing Suite for APM Backend"
echo "=================================================="

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ K6 is not installed. Please install it first:"
    echo "   macOS: brew install k6"
    echo "   Linux: sudo apt-get install k6"
    echo "   Windows: choco install k6"
    exit 1
fi

# Set base URL (default to local, can be overridden)
BASE_URL=${BASE_URL:-"http://localhost:8051"}
echo "🎯 Target URL: $BASE_URL"

# Function to run test with proper formatting
run_test() {
    local test_name=$1
    local test_file=$2
    local description=$3
    
    echo ""
    echo "🧪 Running $test_name"
    echo "📝 Description: $description"
    echo "⏱️  Started at: $(date)"
    echo "----------------------------------------"
    
    k6 run --env BASE_URL=$BASE_URL $test_file
    
    echo "✅ $test_name completed at: $(date)"
    echo "========================================"
}

# Menu for test selection
echo ""
echo "Select test to run:"
echo "1) Load Test (Gradual ramp-up, 16 minutes)"
echo "2) Stress Test (High load, breaking point, 9 minutes)"
echo "3) Spike Test (Sudden traffic spikes, 2 minutes)"
echo "4) Endurance Test (Long duration, 34 minutes)"
echo "5) Run All Tests (Sequential execution)"
echo "6) Custom Test (specify your own file)"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        run_test "Load Test" "load-test.js" "Gradual load increase to test normal capacity"
        ;;
    2)
        run_test "Stress Test" "stress-test.js" "High load to find breaking point"
        ;;
    3)
        run_test "Spike Test" "spike-test.js" "Sudden traffic spikes to test elasticity"
        ;;
    4)
        run_test "Endurance Test" "endurance-test.js" "Long-duration test for memory leaks"
        ;;
    5)
        echo "🔄 Running all tests sequentially..."
        run_test "Load Test" "load-test.js" "Gradual load increase"
        sleep 30  # Cool down between tests
        run_test "Stress Test" "stress-test.js" "High load testing"
        sleep 30
        run_test "Spike Test" "spike-test.js" "Sudden traffic spikes"
        sleep 30
        run_test "Endurance Test" "endurance-test.js" "Long-duration testing"
        echo "🎉 All tests completed!"
        ;;
    6)
        read -p "Enter the test file name: " custom_file
        if [ -f "$custom_file" ]; then
            run_test "Custom Test" "$custom_file" "User-defined test"
        else
            echo "❌ File $custom_file not found!"
        fi
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "📊 Test Results Summary:"
echo "- Check Grafana dashboards for detailed metrics"
echo "- Monitor distributed traces in Tempo"
echo "- Review alert notifications if any were triggered"
echo "- Analyze performance trends over time"
echo ""
echo "🔗 Useful Links:"
echo "   Grafana: http://localhost:3000"
echo "   Prometheus: http://localhost:9090"
echo "   Tempo: http://localhost:3200"
