#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Model Pool Health Check Script v2.0
Check model health every 6 hours
Support 4 pools: fast, smart, text, vision
"""

import json
import subprocess
from datetime import datetime
import sys
import os

CONFIG_FILE = '.openclaw/.openclaw/workspace/config/model-pools.json'
LOG_FILE = '.openclaw/.openclaw/workspace/logs/model-health.log'
STATUS_FILE = '.openclaw/.openclaw/workspace/data/model-health-status.json'

def log(msg, level='INFO'):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_msg = f"[{timestamp}] [{level}] {msg}"
    print(log_msg)
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_msg + '\n')
    except:
        pass

def check_model_health(model_name):
    try:
        result = subprocess.run(
            ['openclaw', 'models', 'status'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            if model_name in result.stdout:
                return {
                    'status': 'healthy',
                    'api_reachable': True,
                    'last_check': datetime.now().isoformat()
                }
            else:
                return {
                    'status': 'not_configured',
                    'api_reachable': False,
                    'last_check': datetime.now().isoformat()
                }
        else:
            return {
                'status': 'error',
                'api_reachable': False,
                'error': result.stderr[:100] if result.stderr else 'Unknown error',
                'last_check': datetime.now().isoformat()
            }
    except Exception as e:
        return {
            'status': 'error',
            'api_reachable': False,
            'error': str(e)[:100],
            'last_check': datetime.now().isoformat()
        }

def main():
    log("=" * 60)
    log("Model Pool Health Check v2.0")
    log("=" * 60)
    
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except Exception as e:
        log(f"ERROR: Failed to read config: {e}", 'ERROR')
        return
    
    health_status = {
        'timestamp': datetime.now().isoformat(),
        'pools': {}
    }
    
    pool_names = ['fast', 'smart', 'text', 'vision']
    
    for pool_name in pool_names:
        if pool_name not in config['pools']:
            continue
            
        pool_config = config['pools'][pool_name]
        log(f"\nChecking {pool_config['name']} ({pool_name})")
        
        pool_status = {
            'name': pool_config['name'],
            'primary': {},
            'fallback': {}
        }
        
        primary_model = pool_config['primary']
        log(f"  Primary: {primary_model}")
        pool_status['primary'] = check_model_health(primary_model)
        log(f"    Status: {pool_status['primary']['status']}")
        
        fallback_model = pool_config['fallback']
        log(f"  Fallback: {fallback_model}")
        pool_status['fallback'] = check_model_health(fallback_model)
        log(f"    Status: {pool_status['fallback']['status']}")
        
        health_status['pools'][pool_name] = pool_status
    
    try:
        os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)
        with open(STATUS_FILE, 'w', encoding='utf-8') as f:
            json.dump(health_status, f, indent=2, ensure_ascii=False)
        log(f"\nStatus saved: {STATUS_FILE}")
    except Exception as e:
        log(f"WARNING: Failed to save status: {e}", 'WARN')
    
    log("\n" + "=" * 60)
    log("Health Check Report")
    log("=" * 60)
    
    healthy_count = 0
    total_count = len(health_status['pools'])
    
    for pool_name, pool_status in health_status['pools'].items():
        primary_status = pool_status['primary']['status']
        fallback_status = pool_status['fallback']['status']
        
        if primary_status == 'healthy':
            healthy_count += 1
        
        status_icon = 'OK' if primary_status == 'healthy' else 'WARN'
        log(f"{status_icon} {pool_status['name']}: Primary[{primary_status}] Fallback[{fallback_status}]")
    
    health_rate = (healthy_count / total_count * 100) if total_count > 0 else 0
    log(f"\nHealth Rate: {healthy_count}/{total_count} ({health_rate:.0f}%)")
    log("=" * 60)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        log(f"ERROR: Health check failed: {e}", 'ERROR')
        import traceback
        traceback.print_exc()
