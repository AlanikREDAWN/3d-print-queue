require('dotenv').config();

const airtable_token = process.env.AIRTABLE_TOKEN


var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: airtable_token
});
var base = Airtable.base('appmu5YfYqhWUbskA');


function getContentFromForm() {
    let name = document.getElementById('name').value;

    let email = document.getElementById('email').value;

    let notes = document.getElementById('notes').value;

    let file = document.getElementById('file').value;

    const fileURL = URL.createObjectURL(file);
    
    base('Table 1').create([
        {
            "fields": {
                "Name": name,
                "Email": email,
                "File": [
                    {
                        "url": fileURL
                    }
                ],
                "Status": "Submitted"
            }
        }
    ])
}