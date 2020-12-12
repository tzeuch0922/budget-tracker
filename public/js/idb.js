// create variable to hold db connection
let db;

// establish a connection to IndexedDB database
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event)
{
    // save a reference to the database
    const db = event.target.result;

    // create an object store
    db.createObjectStore('new_budget', { autoIncrement: true });
};

// upon a successful connection
request.onsuccess = function(event)
{
    db = event.target.result;

    // check if app is online
    if(navigator.onLine)
    {
        uploadBudget();
    }
};

request.onerror = function(event)
{
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt submit with no internet
function saveRecord(record)
{
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access the object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // add record to store
    budgetObjectStore.add(record);
}

function uploadBudget()
{
    // open a transaction on db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function()
    {
        if(getAll.result.length > 1)
        {
            fetch('/api/transaction',
            {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers:
                {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse =>
            {
                if(serverResponse.message)
                {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_budget'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_budget');
                budgetObjectStore.clear();
                alert('Saved transaction has been submitted!');
            })
            .catch(err =>
            {
                console.log(err);
            });
        }
        else if(getAll.result.length === 1)
        {
            fetch('/api/transaction/bulk',
            {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers:
                {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse =>
            {
                if(serverResponse.message)
                {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_budget'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_budget');
                budgetObjectStore.clear();
                alert('All saved transactions been submitted!');
            })
            .catch(err =>
            {
                console.log(err);
            });
        }
    };
}
window.addEventListener('online', uploadBudget);