import selenium
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def scrape_ratemyprofessor(professor_name):
    
    first, last = professor_name.split(" ")[0], professor_name.split(" ")[1]

    # Initialize the WebDriver
    driver = webdriver.Chrome()
    # Open the main page
    driver.get("https://www.ratemyprofessors.com/search/professors/15723?q=")

    # Wait for the search input to be available
    search_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "SearchResultsPage__SearchResultsPageHeader-vhbycj-3 qJihh"))
    )

    body = driver.find_element(By.XPATH, '/html/body/div[1]/div/div/div[3]/div[1]/div[1]/div[5]')
    prof_list = body.find_elements(By.CLASS_NAME, "TeacherCard__StyledTeacherCard-syjs0d-0 dLJIlx")

    for prof in prof_list:
        prof_name = prof.find_element(By.CLASS_NAME, "TeacherCard__StyledTeacherCardName-syjs0d-10 fKZxTx").text
        if prof_name == professor_name:
            prof.click()
            break


