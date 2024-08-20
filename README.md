# BART FrontEnd with Login Page Having Facial Recognition Feature

- **Facial Recognition Login:**
  - Users can take a photo while logging in.
  - The photo is matched with the database.

- **Access Control:**
  - If the photo matches with one of the users in the database, access to the system is granted.
  - If there is no match, an error login message is displayed.

- **Configuration:**
  - After cloning the repository, add your own `.env` file to the folder.
  - The `.env` file should contain the following information:
    - `REACT_APP_AWS_ACCESS_KEY_ID`
    - `REACT_APP_AWS_SECRET_ACCESS_KEY`
    - `REACT_APP_AWS_REGION`
    - `REACT_APP_S3_BUCKET`
