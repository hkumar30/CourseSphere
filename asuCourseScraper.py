from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import pandas as pd
import logging
import time
from urllib.parse import quote
from bs4 import BeautifulSoup
import sys
import json

def scrape_asu_class(subject, course_number):
    # Initialize the WebDriver
    driver = webdriver.Chrome()

    # Open the ASU class schedule page
    driver.get(f"https://catalog.apps.asu.edu/catalog/courses/courselist?catalogNbr={course_number}&subject={subject}&term=2251")

    # Wait for the page to load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH,"/html/body/div[2]/div[2]/div[3]/div[1]/div/div[4]/div/div/div/div[1]/div[2]"))
    )

    result = {'Description': None}
    # Extract the class information
    result['Description'] = driver.find_element(By.XPATH, "/html/body/div[2]/div[2]/div[3]/div[1]/div/div[4]/div/div/div/div[1]/div[2]").text
    
    return result


if __name__ == "__main__":  
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Invalid number of arguments"}))
        sys.exit(1)

    subject = sys.argv[1]
    course_number = sys.argv[2]

    try:
        result = scrape_asu_class(subject, course_number)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))