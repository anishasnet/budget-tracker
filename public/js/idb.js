//db connection
let db;

// connection to IndexedDB budget_tracker database
const request = indexedDB.open('budget_tracker', 1);

// if database version changes request carried
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

//successful db creation
request.onsuccess = function(event) {
    //connection created
    db = event.target.result;
    //if online
    if(navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    //logging error
    console.log(event.target.errorCode);
}

// new transaction if no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    //adding the record to store
    transactionObjectStore.add(record);
}

//if online uploading the transaction
function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    //getting all records from store
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        // if data in the database
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type' : 'application/json'
                }
            })
            // send it to the server
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse)
                }
                // new object for transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear items in store
                transactionObjectStore.clear();
                alert('All transactions has been submitted.');
            })
            .catch(err => {
                console.log(err)
            })
        }
    }
}
// listen for online connection
window.addEventListener('online', uploadTransaction);

