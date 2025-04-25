// Utility pentru comparări normalize (ignori majuscule, spații, cratime, etc.)
function normalize(str) {
    return str ? str.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
}

// State pentru filtre
const filtreSelectate = {
    tipuri: [],      // ex: ["tshirts","jeans"]
    culori: [],      // ex: ["red","black"]
    stiluri: [],     // ex: ["casual","formal"]
    pretMin: 0,
    pretMax: 500
};

let currentPage = 0;
const itemsPerPage = 12;
let produseGlobale = [];
let produsCurentId = null;

// =======================================
// 1. Funcții de filtrare
// =======================================
function actualizeazaFiltre() {
    filtreSelectate.tipuri = [];
    filtreSelectate.stiluri = [];

    document
        .querySelectorAll(".optiuni-filtru input[type='checkbox']")
        .forEach(cb => {
        if (cb.checked) {
            const label = cb.parentElement.querySelector("span").innerText;
            const norm = normalize(label);
            // Dacă e unul din tipuri
            if (["tshirts", "shirts", "jeans", "shorts"].includes(norm)) {
                filtreSelectate.tipuri.push(norm);
            } else {
                // Altfel e stil
                filtreSelectate.stiluri.push(norm);
            }
        }
    });

    currentPage = 0;
    afiseazaProduse(currentPage);
}

function actualizeazaCulori(e) {
    const culoare = e.currentTarget.style.backgroundColor;
    const idx = filtreSelectate.culori.indexOf(culoare);
    if (idx >= 0) {
        filtreSelectate.culori.splice(idx, 1);
        e.currentTarget.classList.remove("selected");
    } else {
        filtreSelectate.culori.push(culoare);
        e.currentTarget.classList.add("selected");
    }
    currentPage = 0;
    afiseazaProduse(currentPage);
}

function updateSlider() {
    filtreSelectate.pretMin = parseInt(document.getElementById("range-min").value);
    filtreSelectate.pretMax = parseInt(document.getElementById("range-max").value);
    document.getElementById("min-price").textContent = filtreSelectate.pretMin;
    document.getElementById("max-price").textContent = filtreSelectate.pretMax;
}

// =======================================
// 2. Toggle dropdown filtre
// =======================================
function toggleDropdown(el) {
    const icon = el.querySelector("i");
    const next = el.nextElementSibling;
    if (next && next.classList.contains("optiuni-filtru")) {
        next.classList.toggle("show");
        icon.classList.toggle("rotate");
    }
}

// =======================================
// 3. Afișare și paginare produse
// =======================================
function afiseazaProduse(page) {
    const itemsDiv = document.querySelector("#items_id");
    itemsDiv.innerHTML = "";

    // 3.1. Aplică filtre
    const produseFiltrate = produseGlobale.filter(p => {
        const matchTip =
        filtreSelectate.tipuri.length === 0 ||
        filtreSelectate.tipuri.includes(normalize(p.categorie));
        const matchCuloare =
        filtreSelectate.culori.length === 0 ||
        filtreSelectate.culori.includes(p.culoare);
        const matchStil =
        filtreSelectate.stiluri.length === 0 ||
        filtreSelectate.stiluri.includes(normalize(p.stil));
        const matchPret =
        p.pret >= filtreSelectate.pretMin && p.pret <= filtreSelectate.pretMax;
        return matchTip && matchCuloare && matchStil && matchPret;
    });

    // 3.2. Paginare
    const start = page * itemsPerPage;
    const end = start + itemsPerPage;
    const produseDeAfisat = produseFiltrate.slice(start, end);

    // 3.3. Render
    produseDeAfisat.forEach((prod, index) => {
        const starClass = prod.isFavorited ? "bi-star-fill" : "bi-star";
        const cartClass = prod.inCart ? "bi-cart-check" : "bi-cart4";
        const ratingText =
        prod.rating === null ? "Fără rating" : prod.rating.toFixed(1);

        const produsDiv = document.createElement("div");
        produsDiv.innerHTML = `
      <img src="${prod.imagine}" alt="${prod.nume}">
      <h1>${prod.nume}</h1>
      <p>${prod.descriere}</p>
      <p>Rating: ${ratingText}</p>
      <p>Preț: ${prod.pret} Lei</p>
      <button class="btn-wish sss">
        <i class="bi ${starClass}"></i>
      </button>
      <button class="btn-cart sss">
        <i class="bi ${cartClass}"></i>
      </button>
      <button class="btn-review sss" style="font-size:0.9rem"
              onclick="deschideRecenzie('${prod.id}')">
        <i class="bi bi-chat-left-text"></i> Recenzii
      </button>
    `;
        itemsDiv.appendChild(produsDiv);
    });

    // 3.4. Event listeners pentru wishlist și cart
    document.querySelectorAll(".btn-wish").forEach((btn, idx) => {
        const prod = produseFiltrate[start + idx];
        const icon = btn.querySelector("i");
        btn.addEventListener("click", () => {
            prod.isFavorited = !prod.isFavorited;
            icon.classList.toggle("bi-star-fill");
            icon.classList.toggle("bi-star");
            updateLocalStorage();
        });
    });

    document.querySelectorAll(".btn-cart").forEach((btn, idx) => {
        const prod = produseFiltrate[start + idx];
        const icon = btn.querySelector("i");
        btn.addEventListener("click", () => {
            prod.inCart = !prod.inCart;
            icon.classList.toggle("bi-cart4");
            icon.classList.toggle("bi-cart-check");
            updateCartLocalStorage();
            updateCartCountUI();
        });
    });

    updatePageNumber();
}

// =======================================
// 4. LocalStorage: favorites, cart
// =======================================
function updateLocalStorage() {
    const favoriteIds = produseGlobale
        .filter(p => p.isFavorited)
        .map(p => p.id);
    localStorage.setItem("favorites", JSON.stringify(favoriteIds));
}

function loadFavoritesFromLocalStorage() {
    const favIds = JSON.parse(localStorage.getItem("favorites")) || [];
    produseGlobale.forEach(p => {
        p.isFavorited = favIds.includes(p.id);
    });
}

function updateCartLocalStorage() {
    const cartIds = produseGlobale.filter(p => p.inCart).map(p => p.id);
    localStorage.setItem("cart", JSON.stringify(cartIds));
}

function loadCartFromLocalStorage() {
    const cartIds = JSON.parse(localStorage.getItem("cart")) || [];
    produseGlobale.forEach(p => {
        p.inCart = cartIds.includes(p.id);
    });
}

function updateCartCountUI() {
    const count = produseGlobale.filter(p => p.inCart).length;
    document.getElementById("cart-count").textContent = count;
}

function updatePageNumber() {
    const maxPages = Math.ceil(
        produseGlobale.filter(p => {
            // recalculează lungimea după filtrare
            const matchTip =
            filtreSelectate.tipuri.length === 0 ||
            filtreSelectate.tipuri.includes(normalize(p.categorie));
            const matchCuloare =
            filtreSelectate.culori.length === 0 ||
            filtreSelectate.culori.includes(p.culoare);
            const matchStil =
            filtreSelectate.stiluri.length === 0 ||
            filtreSelectate.stiluri.includes(normalize(p.stil));
            const matchPret =
            p.pret >= filtreSelectate.pretMin && p.pret <= filtreSelectate.pretMax;
            return matchTip && matchCuloare && matchStil && matchPret;
        }).length / itemsPerPage
    );
    document.querySelector(
        "#Page"
    ).textContent = `Pagina ${currentPage + 1} din ${maxPages}`;
}

// =======================================
// 5. Recenzii și rating
// =======================================
function deschideRecenzie(id) {
    produsCurentId = id;
    document.getElementById("modal-recenzie").style.display = "flex";
    afiseazaRecenzii();
}

function inchideRecenzie() {
    document.getElementById("modal-recenzie").style.display = "none";
    produsCurentId = null;
}

function afiseazaRecenzii() {
    const container = document.getElementById("recenzii-afisate");
    const toate = JSON.parse(localStorage.getItem("recenzii")) || {};
    const recenzii = toate[produsCurentId] || [];
    container.innerHTML = recenzii
        .map(r => `<p>⭐${r.rating} - ${r.text}</p>`)
        .join("");
}

function salveazaRecenzie() {
    const text = document.getElementById("input-recenzie").value.trim();
    const rating = parseInt(document.getElementById("input-rating").value, 10);
    if (!text || isNaN(rating) || rating < 1 || rating > 5) {
        alert("Completează corect recenzia și ratingul (1-5)");
        return;
    }

    const toate = JSON.parse(localStorage.getItem("recenzii")) || {};
    toate[produsCurentId] = toate[produsCurentId] || [];
    toate[produsCurentId].push({ text, rating });
    localStorage.setItem("recenzii", JSON.stringify(toate));

    // Recalculează media rating-ului pentru produs
    const recenzii = toate[produsCurentId];
    const media =
    recenzii.reduce((sum, r) => sum + r.rating, 0) / recenzii.length;
    const prod = produseGlobale.find(p => p.id === produsCurentId);
    if (prod) prod.rating = media;

    document.getElementById("input-recenzie").value = "";
    document.getElementById("input-rating").value = "";
    afiseazaRecenzii();
    afiseazaProduse(currentPage);
}

// =======================================
// 6. Fetch produse + inițializare
// =======================================
fetch("../produse.json")
    .then(res => res.json())
    .then(produse => {
    produseGlobale = produse.map(p => ({
        ...p,
        isFavorited: false,
        inCart: false,
        rating: null
    }));

    // Încarcă rating-urile salvate
    const toate = JSON.parse(localStorage.getItem("recenzii")) || {};
    produseGlobale.forEach(p => {
        const rec = toate[p.id] || [];
        if (rec.length) {
            p.rating = rec.reduce((s, r) => s + r.rating, 0) / rec.length;
        }
    });

    loadFavoritesFromLocalStorage();
    loadCartFromLocalStorage();
    updateCartCountUI();
    afiseazaProduse(currentPage);
})
    .catch(err => console.error("Eroare încărcare produse:", err));

// =======================================
// 7. Paginare
// =======================================
document.getElementById("nextPage").addEventListener("click", () => {
    const maxPages = Math.ceil(produseGlobale.length / itemsPerPage);
    if (currentPage < maxPages - 1) {
        currentPage++;
        afiseazaProduse(currentPage);
    }
});

document.getElementById("downPage").addEventListener("click", () => {
    if (currentPage > 0) {
        currentPage--;
        afiseazaProduse(currentPage);
    }
});

// =======================================
// 8. Setare event listeners pentru filtre
// =======================================
document.addEventListener("DOMContentLoaded", () => {
    document
        .querySelectorAll(".optiuni-filtru input[type='checkbox']")
        .forEach(cb => cb.addEventListener("change", actualizeazaFiltre));

    document
        .querySelectorAll(".colorButton")
        .forEach(btn => btn.addEventListener("click", actualizeazaCulori));

    document
        .getElementById("range-min")
        .addEventListener("input", updateSlider);
    document
        .getElementById("range-max")
        .addEventListener("input", updateSlider);

    document
        .querySelector(".btn-aplica")
        .addEventListener("click", e => {
        e.preventDefault();
        afiseazaProduse(0);
    });
});
