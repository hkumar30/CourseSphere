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

def scrape_asu_class_details(subject, course_number):
    # Initialize the WebDriver
    driver = webdriver.Chrome()

    # Open the ASU class schedule page
    driver.get(f"https://catalog.apps.asu.edu/catalog/classes/classlist?campusOrOnlineSelection=A&catalogNbr={course_number}&honors=F&promod=F&searchType=all&subject={subject}&term=2251")

    # Wait for the page to load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH,"/html/body/div[2]/div[2]/div[2]/div/div/div[5]/div/div"))
    )

    profs = []
    course_title = ""
    # Extract the class information
    classes = driver.find_element(By.XPATH, "/html/body/div[2]/div[2]/div[2]/div/div/div[5]/div/div").get_attribute('innerHTML')
    soup = BeautifulSoup(classes, 'html.parser')

    element = soup.find('div', {'class': 'class-results-rows'}) 
    course_title = element.find('div', {'class': 'class-results-cell pointer title d-none d-lg-inline border-focus'}).text.strip()
    # course_description = element.find('div', {'id': 'class-details'}).text.strip()
    for row in element.find_all('div', {'class': 'class-results-cell instructor'}):
        profs = profs+[x.replace('Multiple instructors', '').strip() for x in row.text.split(",") if x.strip() != 'Staff']

    driver.quit()
    return {"profs": list(set(profs)), "course_title": course_title}


scrape_asu_class_details(sys.argv[1], sys.argv[2])


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Invalid number of arguments"}))
        sys.exit(1)

    subject = sys.argv[1]
    course_number = sys.argv[2]

    try:
        result = scrape_asu_class_details(subject, course_number)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))