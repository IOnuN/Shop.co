function toggleDropdown(el) {
    const icon = el.querySelector("i");
    const next = el.nextElementSibling;

    if (next && next.classList.contains("optiuni-filtru")) {
        next.classList.toggle("show");
        icon.classList.toggle("rotate");
    }
}

let currentPage = 0;
const itemsPerPage = 12;
let produseGlobale = [];

function updateLocalStorage() {
    const favoriteIds = produseGlobale.filter(prod => prod.isFavorited).map(prod => prod.id);
    localStorage.setItem("favorites", JSON.stringify(favoriteIds));
}

function loadFavoritesFromLocalStorage() {
    const favoriteIds = JSON.parse(localStorage.getItem("favorites")) || [];
    produseGlobale.forEach(prod => {
        prod.isFavorited = favoriteIds.includes(prod.id);
    });
}

function updateCartLocalStorage() {
    const cartIds = produseGlobale.filter(prod => prod.inCart).map(prod => prod.id);
    localStorage.setItem("cart", JSON.stringify(cartIds));
}

function loadCartFromLocalStorage() {
    const cartIds = JSON.parse(localStorage.getItem("cart")) || [];
    produseGlobale.forEach(prod => {
        prod.inCart = cartIds.includes(prod.id);
    });
}

function updateCartCountUI() {
    const count = produseGlobale.filter(p => p.inCart).length;
    document.getElementById("cart-count").textContent = count;
}

function updatePageNumber() {
    const maxPages = Math.ceil(produseGlobale.length / itemsPerPage);
    document.querySelector("#Page").textContent = `Pagina ${currentPage + 1} din ${maxPages}`;
}

function afiseazaProduse(page) {
    let itemsDiv = document.querySelector("#items_id");
    itemsDiv.innerHTML = "";

    let start = page * itemsPerPage;
    let end = start + itemsPerPage;
    let produseDeAfisat = produseGlobale.slice(start, end);

    produseDeAfisat.forEach((prod, index) => {
        let produsDiv = document.createElement("div");

        const starClass = prod.isFavorited ? "bi-star-fill" : "bi-star";
        const cartClass = prod.inCart ? "bi-cart-check" : "bi-cart4";

        produsDiv.innerHTML = `
            <img src="${prod.imagine}" alt="${prod.nume}">
            <h1>${prod.nume}</h1>
            <p>${prod.descriere}</p>
            <p>Rating: ${prod.rating}</p>
            <p>Preț: ${prod.pret} Lei</p>
            <button class="btn-wish sss" >
                <i class="bi ${starClass}"></i>
            </button>
            <button class="btn-cart sss">
                <i class="bi ${cartClass}"></i>
            </button>
            <button style="font-size: 0.9rem" class="btn-review sss" onclick="deschideRecenzie('${prod.id}')">
                <i class="bi bi-chat-left-text"></i> Recenzii
            </button>
        `;

        itemsDiv.appendChild(produsDiv);
    });

    document.querySelectorAll(".btn-wish").forEach((btn, index) => {
        const produs = produseGlobale[start + index];
        const icon = btn.querySelector("i");

        btn.addEventListener("click", function () {
            produs.isFavorited = !produs.isFavorited;
            icon.classList.toggle("bi-star-fill");
            icon.classList.toggle("bi-star");
            updateLocalStorage();
        });
    });

    document.querySelectorAll(".btn-cart").forEach((btn, index) => {
        const produs = produseGlobale[start + index];
        const icon = btn.querySelector("i");

        btn.addEventListener("click", function () {
            produs.inCart = !produs.inCart;

            if (produs.inCart) {
                icon.classList.remove("bi-cart4");
                icon.classList.add("bi-cart-check");
            } else {
                icon.classList.remove("bi-cart-check");
                icon.classList.add("bi-cart4");
            }

            updateCartLocalStorage();
            updateCartCountUI();
        });
    });


    updatePageNumber();
}

fetch('../produse.json')
    .then(response => response.json())
    .then(produse => {
    produseGlobale = produse.map(p => ({
        ...p,
        isFavorited: false,
        inCart: false
    }));

    loadFavoritesFromLocalStorage();
    loadCartFromLocalStorage();
    updateCartCountUI();
    afiseazaProduse(currentPage);
})
    .catch(error => {
    console.error("Eroare la încărcarea JSON-ului:", error);
});

document.querySelector("#nextPage").addEventListener("click", () => {
    const maxPages = Math.ceil(produseGlobale.length / itemsPerPage);
    if (currentPage < maxPages - 1) {
        currentPage++;
        afiseazaProduse(currentPage);
    }
});

document.querySelector("#downPage").addEventListener("click", () => {
    if (currentPage > 0) {
        currentPage--;
        afiseazaProduse(currentPage);
    }
});
let produsCurentId = null;

function deschideRecenzie(id) {
    produsCurentId = id;
    const modal = document.getElementById('modal-recenzie');
    modal.style.display = 'flex';
    afiseazaRecenzii();
}

function inchideRecenzie() {
    document.getElementById('modal-recenzie').style.display = 'none';
    produsCurentId = null;
}

function afiseazaRecenzii() {
    const container = document.getElementById('recenzii-afisate');
    const toateRecenziile = JSON.parse(localStorage.getItem('recenzii')) || {};
    const recenziiProdus = toateRecenziile[produsCurentId] || [];
    container.innerHTML = recenziiProdus.map(r => `<p>⭐${r.rating} - ${r.text}</p>`).join('');
}

function salveazaRecenzie() {
    const text = document.getElementById('input-recenzie').value.trim();
    const rating = parseInt(document.getElementById('input-rating').value);
    if (!text || rating < 1 || rating > 5) {
        alert("Completează corect recenzia și ratingul (1-5)");
        return;
    }

    const toateRecenziile = JSON.parse(localStorage.getItem('recenzii')) || {};
    if (!toateRecenziile[produsCurentId]) {
        toateRecenziile[produsCurentId] = [];
    }

    toateRecenziile[produsCurentId].push({ text, rating });
    localStorage.setItem('recenzii', JSON.stringify(toateRecenziile));

    document.getElementById('input-recenzie').value = '';
    document.getElementById('input-rating').value = '';
    afiseazaRecenzii();
}
