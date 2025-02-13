// register our service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").then((reg) => {
      console.log("Service worker registered.", reg);
    });
  });
}

let transactions = [];
let chart;
const transactionForm = createTransactionForm();
const transactionApi = createTransactionApi();

initTransactions();

document.querySelector("#add-btn").onclick = function () {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
  sendTransaction(false);
};

function createTransactionForm() {
  const nameEl = document.querySelector("#transaction-name");
  const amountEl = document.querySelector("#transaction-amount");
  const errorEl = document.querySelector(".form .error");

  const showError = (message) => {
    errorEl.textContent = message;
  };

  // return false if invalid and display validation message
  const validate = () => {
    // validate form
    if (nameEl.value === "" || amountEl.value === "") {
      showError("Information is missing.");
      return false;
    }
    showError("");
    return true;
  };

  // return transaction object from form input
  const transaction = () => {
    return {
      name: nameEl.value,
      value: amountEl.value,
      date: new Date().toISOString()
    };
  };

  // clear form inputs
  const clear = () => {
    nameEl.value = "";
    amountEl.value = "";
    showError("");
  };

  return Object.freeze({ transaction, validate, clear, showError });
}

function createTransactionApi() {
  const create = (transaction) => {
    return fetch("/api/transaction", {
      method: "POST",
      body: JSON.stringify(transaction),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json"
      }
    }).then((response) => {
      return response.json();
    });
  };

  const fetchAll = () => {
    return fetch("/api/transaction").then((response) => {
      return response.json();
    });
  };
  return Object.freeze({ create, fetchAll });
}

function initTransactions() {
  transactionApi.fetchAll().then((data) => {
    // save db data on global variable
    transactions = data;

    renderTransactionsChart();
  });
}

function sendTransaction(isAdding) {
  if (!transactionForm.validate()) {
    return;
  }

  // create record
  const transaction = transactionForm.transaction();

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
  transactionApi
    .create(transaction)
    .then((data) => {
      if (data.errors) {
        transactionForm.showError("Information is missing.");
      } else {
        transactionForm.clear();
      }
    })
    .catch(() => {
      // fetch failed, so save in indexed db
      saveRecord(transaction);
      transactionForm.clear();
    });
}

function renderTransactionsChart() {
  populateTotal();
  populateTable();
  populateChart();
}

function populateTotal() {
  // reduce transaction amounts to a single total value
  const total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  const totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  const tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach((transaction) => {
    // create and populate a table row
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  const reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  const labels = reversed.map((t) => {
    const date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  const data = reversed.map((t) => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (chart) {
    chart.destroy();
  }

  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Total over time.",
          fill: true,
          backgroundColor: "#6666ff",
          data
        }
      ]
    }
  });
}

// let transactions = [];
// let chart;

// const transactionForm = createTransactionForm();
// const transactionApi = createTransactionApi();
// initializeTransaction();

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker.register("/service-worker.js").then((reg) => {
//       console.log("Service worker registered.", reg);
//     });
//   });
// }

// fetch("/api/transaction")
//   .then(response => {
//     return response.json();
//   })
//   .then(data => {
//     // save db data on global variable
//     transactions = data;

//     populateTotal();
//     populateTable();
//     populateChart();
//   });

// function populateTotal() {
//   // reduce transaction amounts to a single total value
//   const total = transactions.reduce((total, t) => {
//     return total + parseInt(t.value);
//   }, 0);

//   const totalEl = document.querySelector("#total");
//   totalEl.textContent = total;
// }

// function populateTable() {
//   const tbody = document.querySelector("#tbody");
//   tbody.innerHTML = "";

//   transactions.forEach(transaction => {
//     // create and populate a table row
//     const tr = document.createElement("tr");
//     tr.innerHTML = `
//       <td>${transaction.name}</td>
//       <td>${transaction.value}</td>
//     `;

//     tbody.appendChild(tr);
//   });
// }

// function createTransactionForm() {
//   const nameEl = document.querySelector("#transaction-name");
//   const amountEl = document.querySelector("#transaction-amount");
//   const errorEl = document.querySelector(".form .error");

//   // validate form

//   const revealError = (message) => {
//     errorEl.textContent = message;
//   };

//   const validate = () => {
//     if (nameEl.value === "" || amountEl.value === "") {
//       revealError("Information is missing.");
//       return false;
//     }
//     revealError("");
//     return true;
//   };
  
//   // create record
//   const transaction = () => {
//     return {
//       name: nameEl.value,
//       value: amountEl.value,
//       date: new Date().toISOString()
//     };
//   };
  
//   // clear inputs
//   const clear = () => {
//     nameEl.value = "";
//     amountEl.value = "";
//     revealError();
//   };

//   return Object.freeze({ transaction, validate, clear, revealError });
// }

// function createTransactionApi() {
//   const create = (transaction) => {
//     return fetch("/api/transaction", {
//       method: "POST",
//       body: JSON.stringify(transaction),
//       headers: {
//         Accept: "application/json, text/plain, */*",
//         "Content-Type": "application/json"
//       }
//     }).then((response) => {
//       return response.json();
//     });
//   };

//   const fetchAll = () => {
//     return fetch("/api/transaction").then((response) => {
//       return response.json();
//     });
//   };
//   return Object.freeze({ create, fetchAll });
// }

// function initializeTransaction() {
//   transactionApi.fetchAll().then((data) => {
//     transactions = data;

//     renderTransactionsChart();
//   });
// }

// function sendTransaction(isAdding) {
//   if (!transactionForm.validate()) {
//     return;
//   }

//   const transaction = transactionForm.transaction();

//   if (!isAdding) {
//     transaction.value *= -1;
//   }

//   transactions.unshift(transaction);

//   populateChart();
//   populateTable();
//   populateTotal();

//   transactionApi
//     .create(transaction)
//     .then((data) => {
//       if (data.errors) {
//         transactionForm.revealError("Information is missing.");
//       } else {
//         transactionForm.clear();
//       }
//     })
//     .catch(() => {
//       saveTransaction(transaction);
//       transactionForm.clear();
//     });
// }

// function renderTransactionsChart() {
//   populateTotal();
//   populateTable();
//   populateChart();
// }

// function populateTotal() {
//   const total = transactions.reduce((total, t) => {
//     return total + parseInt(t.value);
//   }, 0);
  
//   const totalEl = document.querySelector('#total');
//   totalEl.textContent = total;
// }

// function populateTable() {
//   const tbody = document.querySelector("#tbody");
//   tbody.innerHTML = "";

//   transactions.forEach((transaction) => {
//     const tr = document.createElement("tr");
//     tr.innerHTML = `
//       <td>${transaction.name}</td>
//       <td>${transaction.value}</td>
//       `;

//       tbody.appendChild(tr);
//   });
// }

// function populateChart() {
//   const reversed = transactions.slice().reverse();
//   let sum = 0;
  
//   // create dates for chart
//   const labels = reversed.map((t) => {
//     const date = new Date(t.date);
//     return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
//   });

//   // delete chart

//   if (chart) {
//     chart.destroy();
//   }

//   const ctx = document.getElementById("chart").getContext("2d");

//   chart = new Chart(ctx, {
//     type: 'line',
//     data: {
//       labels,
//       datasets: [
//         {
//           label: "Total over time",
//           fill: true,
//           backgroundColor: "#6666ff",
//           data
//         }
//       ]
//     }
//   });
// }