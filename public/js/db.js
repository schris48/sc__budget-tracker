let db

const request = indexedDB.open('budgetTracker', 1);

request.onupgradeneeded = function(e) {
  const db = e.target.result;
  db.createObjStore('newBudget', { autoIncrement: true });
};

request.onsuccess = function(e) {
  db = e.target.result;

  if (navigator.onLine) {
    submitBudget();
  }
};

request.onerror = function(e) {
  console.log("Error: " + e.target.errorCode);
}

function saveRecord(record) {
  const transaction = db.transaction(['newBudget'], 'readWrite');
  const store = transaction.objStore('newBudget');

  store.add(record);
}

function submitBudget() {
  const transaction = db.transaction(['newBudget'], 'readWrite');

  const store = transaction.objStore('newBudget');

  const getAllBudgets = store.getAll();

  getAllBudgets.onsuccess = function() {
    if (getAllBudgets.result.length > 0) {
      fetch('api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAllBudgets.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(() => {
        const transaction = db.transaction(['newBudget'], 'readWrite');
        const store = transaction.objStore('newBudget');
        store.clear();
      });
    }
  };
}

function delPending() {
  const transaction = db.transaction(['newBudget'], 'readWrite');
  const store = transaction.objStore('newBudget');
  store.clear();
}

windows.addEventListener('online', submitBudget);