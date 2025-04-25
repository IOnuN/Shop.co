// ————————————————————————————————
// 0. Normalize (ignore case/spaces/punct)
// ————————————————————————————————
function normalize(str) {
    return str ? str.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
}

// ————————————————————————————————
// 1. Stări globale
// ————————————————————————————————
const filtreSelectate = { tipuri: [], culori: [], stiluri: [], pretMin: 0, pretMax: 500 };
let searchTerm = "";
let currentPage = 0;
const itemsPerPage = 12;
let produseGlobale = [];
let produsCurentId = null;

// ————————————————————————————————
// 2. Filtrare & live search
// ————————————————————————————————
function actualizeazaFiltre() {
    filtreSelectate.tipuri = [];
    filtreSelectate.stiluri = [];
    document.querySelectorAll(".optiuni-filtru input[type='checkbox']").forEach(cb => {
        if (cb.checked) {
            const text = cb.parentElement.querySelector("span").innerText;
            const norm = normalize(text);
            if (["tshirts","shirts","jeans","shorts"].includes(norm)) filtreSelectate.tipuri.push(norm);
            else filtreSelectate.stiluri.push(norm);
        }
    });
    currentPage = 0;
    afiseazaProduse(0);
}

function actualizeazaCulori(e) {
    const c = e.currentTarget.style.backgroundColor;
    const idx = filtreSelectate.culori.indexOf(c);
    if (idx >= 0) {
        filtreSelectate.culori.splice(idx,1);
        e.currentTarget.classList.remove("selected");
    } else {
        filtreSelectate.culori.push(c);
        e.currentTarget.classList.add("selected");
    }
    currentPage = 0;
    afiseazaProduse(0);
}

function updateSlider() {
    filtreSelectate.pretMin = +document.getElementById("range-min").value;
    filtreSelectate.pretMax = +document.getElementById("range-max").value;
    document.getElementById("min-price").textContent = filtreSelectate.pretMin;
    document.getElementById("max-price").textContent = filtreSelectate.pretMax;
}

// ————————————————————————————————
// 3. Dropdown filtru
// ————————————————————————————————
function toggleDropdown(el) {
    const icon = el.querySelector("i"), next = el.nextElementSibling;
    if (next?.classList.contains("optiuni-filtru")) {
        next.classList.toggle("show");
        icon.classList.toggle("rotate");
    }
}

// ————————————————————————————————
// 4. Afișare + paginare
// ————————————————————————————————
function afiseazaProduse(page) {
    const container = document.querySelector("#items_id");
    container.innerHTML = "";

    // filtre + search
    const filtrate = produseGlobale.filter(p => {
        const mTip    = !filtreSelectate.tipuri.length  || filtreSelectate.tipuri.includes(normalize(p.categorie));
        const mCol    = !filtreSelectate.culori.length  || filtreSelectate.culori.includes(p.culoare);
        const mStil   = !filtreSelectate.stiluri.length || filtreSelectate.stiluri.includes(normalize(p.stil));
        const mPret   = p.pret >= filtreSelectate.pretMin && p.pret <= filtreSelectate.pretMax;
        const text    = (p.nume + " " + p.descriere).toLowerCase();
        const mSearch = !searchTerm || text.includes(searchTerm);
        return mTip && mCol && mStil && mPret && mSearch;
    });

    // paginare
    const start = page * itemsPerPage;
    const slice = filtrate.slice(start, start + itemsPerPage);

    slice.forEach(prod => {
        const star = prod.isFavorited ? "bi-star-fill" : "bi-star";
        const cart = prod.inCart     ? "bi-cart-check" : "bi-cart4";
        const ratingText = prod.rating == null ? "Fără rating" : prod.rating.toFixed(1);

        const div = document.createElement("div");
        div.innerHTML = `
      <img src="${prod.imagine}" alt="${prod.nume}">
      <h1>${prod.nume}</h1>
      <p>${prod.descriere}</p>
      <p>Rating: ${ratingText}</p>
      <p>Preț: ${prod.pret} Lei</p>
      <button class="btn-wish"><i class="bi ${star}"></i></button>
      <button class="btn-cart"><i class="bi ${cart}"></i></button>
      <button class="btn-review" onclick="deschideRecenzie('${prod.id}')">
        <i class="bi bi-chat-left-text"></i> Recenzii
      </button>
    `;
        container.appendChild(div);
    });

    // wishlist & cart listeners
    document.querySelectorAll(".btn-wish").forEach((btn, i) => {
        const prod = filtrate[start+i], icon = btn.querySelector("i");
        btn.onclick = () => {
            prod.isFavorited = !prod.isFavorited;
            icon.classList.toggle("bi-star-fill");
            icon.classList.toggle("bi-star");
            updateLocalStorage();
        };
    });
    document.querySelectorAll(".btn-cart").forEach((btn, i) => {
        const prod = filtrate[start+i], icon = btn.querySelector("i");
        btn.onclick = () => {
            prod.inCart = !prod.inCart;
            icon.classList.toggle("bi-cart-check");
            icon.classList.toggle("bi-cart4");
            updateCartLocalStorage();
            updateCartCountUI();
        };
    });

    // număr pagină
    const maxPages = Math.ceil(filtrate.length / itemsPerPage);
    document.querySelector("#Page").textContent = `Pagina ${currentPage+1} din ${maxPages}`;
}

// ————————————————————————————————
// 5. LocalStorage favorites & cart
// ————————————————————————————————
function updateLocalStorage() {
    const favs = produseGlobale.filter(p=>p.isFavorited).map(p=>p.id);
    localStorage.setItem("favorites", JSON.stringify(favs));
}
function loadFavoritesFromLocalStorage() {
    const favs = JSON.parse(localStorage.getItem("favorites"))||[];
    produseGlobale.forEach(p=>p.isFavorited=favs.includes(p.id));
}
function updateCartLocalStorage() {
    const cart = produseGlobale.filter(p=>p.inCart).map(p=>p.id);
    localStorage.setItem("cart", JSON.stringify(cart));
}
function loadCartFromLocalStorage() {
    const cart = JSON.parse(localStorage.getItem("cart"))||[];
    produseGlobale.forEach(p=>p.inCart=cart.includes(p.id));
}
function updateCartCountUI() {
    document.getElementById("cart-count").textContent =
    produseGlobale.filter(p=>p.inCart).length;
}

// ————————————————————————————————
// 6. Recenzii & Rating
// ————————————————————————————————
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
    const cont = document.getElementById("recenzii-afisate");
    const toate = JSON.parse(localStorage.getItem("recenzii"))||{};
    const rec = toate[produsCurentId]||[];
    cont.innerHTML = rec.map(r=>`<p>⭐${r.rating} - ${r.text}</p>`).join("");
}
function salveazaRecenzie() {
    const text   = document.getElementById("input-recenzie").value.trim();
    const rating = +document.getElementById("input-rating").value;
    if (!text||isNaN(rating)||rating<1||rating>5) {
        alert("Completează corect recenzia și ratingul (1-5)");
        return;
    }
    const toate = JSON.parse(localStorage.getItem("recenzii"))||{};
    toate[produsCurentId] = toate[produsCurentId]||[];
    toate[produsCurentId].push({ text, rating });
    localStorage.setItem("recenzii", JSON.stringify(toate));

    // recalculează media
    const recs = toate[produsCurentId];
    const media = recs.reduce((s,r)=>s+r.rating,0)/recs.length;
    const p = produseGlobale.find(x=>x.id===produsCurentId);
    if (p) p.rating = media;

    document.getElementById("input-recenzie").value = "";
    document.getElementById("input-rating").value    = "";
    afiseazaRecenzii();
    afiseazaProduse(currentPage);
}

// ————————————————————————————————
// 7. Init: fetch JSON + set listeners
// ————————————————————————————————
document.addEventListener("DOMContentLoaded", () => {
    // filtre
    document.querySelectorAll(".optiuni-filtru input[type='checkbox']")
        .forEach(cb=>cb.onchange = actualizeazaFiltre);
    document.querySelectorAll(".colorButton")
        .forEach(b=>b.onclick = actualizeazaCulori);
    document.getElementById("range-min").oninput = updateSlider;
    document.getElementById("range-max").oninput = updateSlider;
    document.querySelector(".btn-aplica").onclick = e => {
        e.preventDefault();
        afiseazaProduse(0);
    };

    // live-search
    document.getElementById("camp-cautare").oninput = e => {
        searchTerm = e.target.value.trim().toLowerCase();
        currentPage = 0;
        afiseazaProduse(0);
    };

    // pagination
    document.getElementById("nextPage").onclick = () => {
        const max = Math.ceil(produseGlobale.length/itemsPerPage);
        if (currentPage < max - 1) currentPage++, afiseazaProduse(currentPage);
    };
    document.getElementById("downPage").onclick = () => {
        if (currentPage>0) currentPage--, afiseazaProduse(currentPage);
    };

    // fetch produse
    fetch("../produse.json")
        .then(r=>r.json())
        .then(arr => {
        produseGlobale = arr.map(p=>({
            ...p,
            isFavorited: false,
            inCart: false,
            rating: null
        }));
        // încarcă rating-urile deja salvate
        const toate = JSON.parse(localStorage.getItem("recenzii"))||{};
        produseGlobale.forEach(p=>{
            const recs = toate[p.id]||[];
            if(recs.length) p.rating = recs.reduce((s,r)=>s+r.rating,0)/recs.length;
        });
        loadFavoritesFromLocalStorage();
        loadCartFromLocalStorage();
        updateCartCountUI();
        afiseazaProduse(0);
    })
        .catch(err => console.error("Eroare încărcare produse:", err));
});
