function afiseazaProduseFavorite() {
    let itemsDiv = document.querySelector("#items_id");
    itemsDiv.innerHTML = "";
    fetch('../produse.json')
        .then(response => response.json())
        .then(allProducts => {
        const favoriteIds = JSON.parse(localStorage.getItem("favorites")) || [];
        const favoriteProducts = allProducts.filter(prod => favoriteIds.includes(prod.id));
        if (favoriteProducts.length === 0) {
            itemsDiv.innerHTML = "<p>Nu ai produse în lista de dorințe.</p>";
            return;
        }
        favoriteProducts.forEach((prod) => {
            let produsDiv = document.createElement("div");

            produsDiv.innerHTML = `
                    <img src="${prod.imagine}" alt="${prod.nume}">
                    <h1>${prod.nume}</h1>
                    <p>${prod.descriere}</p>
                    <p>Rating: ${prod.rating}</p>
                    <p>Preț: ${prod.pret} Lei</p>
                    <button class="btn-fav">
                        <i class="bi bi-star-fill"></i>
                    </button>
                `;

            itemsDiv.appendChild(produsDiv);
        });
        document.querySelectorAll(".btn-fav").forEach((btn, index) => {
            btn.addEventListener("click", function() {
                const productId = favoriteProducts[index].id;
                const updatedFavorites = favoriteIds.filter(id => id !== productId);
                localStorage.setItem("favorites", JSON.stringify(updatedFavorites));

                afiseazaProduseFavorite();
            });
        });
    })
        .catch(error => {
        console.error("Eroare la încărcarea produselor:", error);
        itemsDiv.innerHTML = "<p>Eroare la încărcarea listei de dorințe.</p>";
    });
}

document.addEventListener('DOMContentLoaded', afiseazaProduseFavorite);