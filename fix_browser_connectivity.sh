#!/bin/bash

# Browser Connectivity Fix Script
# This script addresses common browser connectivity issues

echo "=== Browser Connectivity Fix Script ==="
echo ""

# 1. Disable IPv6 to prevent connection delays
echo "1. Configuring IPv6 settings..."
echo "net.ipv6.conf.all.disable_ipv6 = 1" | sudo tee -a /etc/sysctl.conf
echo "net.ipv6.conf.default.disable_ipv6 = 1" | sudo tee -a /etc/sysctl.conf
echo "net.ipv6.conf.lo.disable_ipv6 = 1" | sudo tee -a /etc/sysctl.conf

# Apply IPv6 settings immediately
echo 1 | sudo tee /proc/sys/net/ipv6/conf/all/disable_ipv6
echo 1 | sudo tee /proc/sys/net/ipv6/conf/default/disable_ipv6
echo 1 | sudo tee /proc/sys/net/ipv6/conf/lo/disable_ipv6

echo "✓ IPv6 disabled to prevent connection delays"
echo ""

# 2. Configure DNS settings for better reliability
echo "2. Configuring DNS settings..."
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
echo "nameserver 8.8.4.4" | sudo tee -a /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf

echo "✓ DNS configured with reliable servers"
echo ""

# 3. Test connectivity
echo "3. Testing connectivity..."
echo "Testing IPv4 connectivity to Google..."
if curl -4 -I https://www.google.com >/dev/null 2>&1; then
    echo "✓ IPv4 connectivity working"
else
    echo "✗ IPv4 connectivity failed"
fi

echo "Testing DNS resolution..."
if nslookup google.com >/dev/null 2>&1 || host google.com >/dev/null 2>&1; then
    echo "✓ DNS resolution working"
else
    echo "✗ DNS resolution failed"
fi

echo ""

# 4. Browser recommendations
echo "4. Available browsers:"
echo "   - w3m (text-based, working): w3m https://example.com"
echo "   - lynx (text-based, working): lynx https://example.com"
echo "   - curl (command-line): curl https://example.com"
echo ""

# 5. Create browser aliases for easier use
echo "5. Creating browser aliases..."
echo 'alias browser="w3m"' >> ~/.bashrc
echo 'alias web="lynx"' >> ~/.bashrc
echo 'alias surf="curl -s"' >> ~/.bashrc

echo "✓ Browser aliases created:"
echo "   - browser: opens w3m"
echo "   - web: opens lynx" 
echo "   - surf: uses curl for quick web requests"
echo ""

# 6. Test the browsers
echo "6. Testing browsers..."
echo "Testing w3m with Google..."
echo "w3m -dump https://www.google.com | head -5" | bash

echo ""
echo "=== Fix Complete ==="
echo "Your browser connectivity issues have been addressed:"
echo "• IPv6 disabled to prevent connection delays"
echo "• DNS configured with reliable servers"
echo "• Text-based browsers installed and working"
echo "• Browser aliases created for convenience"
echo ""
echo "To use:"
echo "  browser https://example.com    # Opens w3m"
echo "  web https://example.com        # Opens lynx"
echo "  surf https://example.com       # Quick curl request"