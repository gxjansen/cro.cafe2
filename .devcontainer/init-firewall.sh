#!/bin/bash
# Initialize firewall rules for secure container operation

# Create ipset for allowed domains
sudo ipset create allowed_domains hash:net -exist

# Add trusted domains
sudo ipset add allowed_domains 104.18.0.0/16 -exist  # Anthropic
sudo ipset add allowed_domains 172.67.0.0/16 -exist  # Anthropic CDN
sudo ipset add allowed_domains 140.82.112.0/20 -exist  # GitHub
sudo ipset add allowed_domains 140.82.113.0/24 -exist  # GitHub API
sudo ipset add allowed_domains 151.101.0.0/16 -exist  # npm registry
sudo ipset add allowed_domains 104.16.0.0/12 -exist  # Cloudflare

# Basic iptables rules
sudo iptables -A OUTPUT -m set --match-set allowed_domains dst -j ACCEPT
sudo iptables -A OUTPUT -m owner --uid-owner node -d 127.0.0.1 -j ACCEPT
sudo iptables -A OUTPUT -m owner --uid-owner node -d 172.17.0.0/16 -j ACCEPT  # Docker network
sudo iptables -A OUTPUT -p udp --dport 53 -j ACCEPT  # DNS

echo "Firewall initialized for secure Claude Code operation"