import logging
from typing import Dict, Any
import sys
import os
import socket

logger = logging.getLogger(__name__)

def is_mysql_running() -> bool:
    """Check if MySQL server is running on localhost:3306"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)  # 1 second timeout
        result = sock.connect_ex(('localhost', 3306))
        sock.close()
        return result == 0
    except:
        return False

def get_database_config() -> Dict[str, Any]:
    """
    Configure database connection with driver fallback logic.
    Tries mysql-connector-python first, falls back to PyMySQL if needed.
    Includes robust error handling and server availability checks.
    """
    # First check if MySQL server is running
    if not is_mysql_running():
        error_msg = (
            "MySQL server is not running on localhost:3306.\n"
            "Please ensure your MySQL server is running before continuing."
        )
        logger.error(error_msg)
        raise ConnectionError(error_msg)

    # Base configuration that works with both drivers
    base_config = {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'AluOptimize',
        'USER': 'root',
        'PASSWORD': 'root123',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES', default_storage_engine=InnoDB, character_set_connection=utf8mb4, collation_connection=utf8mb4_unicode_ci",
        }
    }
    
    try:
        import mysql.connector
        logger.info("Using mysql-connector-python as database driver")
        base_config['ENGINE'] = 'mysql.connector.django'
        base_config['OPTIONS']['use_unicode'] = True
        base_config['OPTIONS']['use_pure'] = True
        return base_config
    except ImportError:
        logger.warning("mysql-connector-python not available, falling back to PyMySQL")
        try:
            import pymysql
            # Register PyMySQL as MySQLdb
            pymysql.install_as_MySQLdb()
            logger.warning("Using PyMySQL as fallback database driver")
            return base_config
        except ImportError as e:
            error_msg = (
                "Neither mysql-connector-python nor PyMySQL are available. "
                "Please install at least one MySQL driver:\n"
                "pip install mysql-connector-python\n"
                "or\n"
                "pip install pymysql"
            )
            logger.error(error_msg)
            raise ImportError(error_msg) from e
        except Exception as e:
            error_msg = f"Failed to initialize MySQL driver: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg) from e