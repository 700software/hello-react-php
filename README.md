Bryan's first React webapp with PHP endpoints
=============================================

Installation to run in production
---------------------------------

1. Extract contents

2. Install `npm` modules automatically based on `package.json`

       cd helloreact
       npm install
       
3. Build the React client-side

       npm run build
       
4. Copy the contents of `helloreact/build` directly into the `htdocs` of your XAMPP or other PHP server-side environment.

5. Create the MySQL database `helloreact` and user account, with matching password as found in the source code of the `build/endpoints` PHP endpoints.

       create database helloreact;
       grant all on helloreact.* to helloreact@localhost identified by 'EoJe0jJWXsAe';
       
All necessary tables will be automatically created when creating your first article in the webapp.

Installation for development purposes
-------------------------------------

For real-time development of the React client-side without having to re-run `npm run build` on every change you will need to segregate the PHP server-side so that you can use the out-of-the-box React server-side for development of the client-side.

1. Copy the `public/endpoints` directory to your XAMPP or other PHP server-side environment.

2. Edit the PHP files on your PHP server-side copy and uncomment the `Access-Control-Allow-Origin` line in each. This will allow requests from the origin of your temporary/development React server-side to gain access to the PHP server-side endpoints.

3. Within `src/App.js`, uncomment the second `var phpEndpoints` line and specify the alternative origin of the PHP endpoints.

4. `npm run start` will start the React client-side and, if all goes according to plan, it links right up to the origin of your PHP server-side.

