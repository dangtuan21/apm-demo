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
echo "5) Advanced Scenarios (Multi-scenario realistic testing, 14 minutes)"
echo "6) Business Workflow (Customer journey testing, 7 minutes)"
echo "7) Chaos Testing (Resilience and recovery testing, 15 minutes)"
echo "8) Run All Basic Tests (1-4 Sequential execution)"
echo "9) Run All Advanced Tests (5-7 Sequential execution)"
echo "10) Custom Test (specify your own file)"

read -p "Enter your choice (1-10): " choice

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
        run_test "Advanced Scenarios" "advanced-scenarios.js" "Multi-scenario realistic user behavior testing"
        ;;
    6)
        run_test "Business Workflow" "business-workflow.js" "Customer journey and business process testing"
        ;;
    7)
        run_test "Chaos Testing" "chaos-testing.js" "System resilience and recovery testing"
        ;;
    8)
        echo "🔄 Running all basic tests sequentially..."
        run_test "Load Test" "load-test.js" "Gradual load increase"
        sleep 30  # Cool down between tests
        run_test "Stress Test" "stress-test.js" "High load testing"
        sleep 30
        run_test "Spike Test" "spike-test.js" "Sudden traffic spikes"
        sleep 30
        run_test "Endurance Test" "endurance-test.js" "Long-duration testing"
        echo "🎉 All basic tests completed!"
        ;;
    9)
        echo "🚀 Running all advanced tests sequentially..."
        run_test "Advanced Scenarios" "advanced-scenarios.js" "Multi-scenario testing"
        sleep 60  # Longer cool down for advanced tests
        run_test "Business Workflow" "business-workflow.js" "Business process testing"
        sleep 60
        run_test "Chaos Testing" "chaos-testing.js" "Chaos engineering testing"
        echo "🎉 All advanced tests completed!"
        ;;
    10)
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
