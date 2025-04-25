document.addEventListener("DOMContentLoaded", () => {
    const cartIds = JSON.parse(localStorage.getItem("cart")) || [];
    const itemsDiv = document.getElementById("items_id");

    if (cartIds.length === 0) {
        itemsDiv.innerHTML = "<p>Coșul tău este gol.</p>";
        return;
    }

    fetch("../produse.json")
        .then((res) => res.json())
        .then((produse) => {
        const produseInCos = produse.filter((p) => cartIds.includes(p.id));

        const total = produseInCos.reduce(
            (sum, prod) => sum + Number(prod.pret),
            0
        );
        document.getElementById(
            "total-amount"
        ).textContent = `Total: ${total} Lei`;

        if (produseInCos.length === 0) {
            itemsDiv.innerHTML = "<p>Produsele nu mai sunt disponibile.</p>";
            return;
        }

        let html = "";
        produseInCos.forEach((prod) => {
            html += `
          <div class="produs-cos">
            <img src="${prod.imagine}" alt="${prod.nume}" width="100">
            <h2>${prod.nume}</h2>
            <p>${prod.descriere}</p>
            <p><strong>Preț:</strong> ${prod.pret} Lei</p>
          </div>
        `;
        });
        itemsDiv.innerHTML = html;
    })
        .catch((err) => {
        console.error("Eroare la încărcarea produselor:", err);
        itemsDiv.innerHTML =
        "<p>Eroare la încărcarea produselor din coș.</p>";
    });

    const payBtn = document.querySelector(".pay");
    const modal = document.getElementById("payment-modal");
    const closeBtn = document.getElementById("close-modal");
    const form = document.getElementById("payment-form");

    payBtn.addEventListener("click", () => (modal.style.display = "flex"));
    closeBtn.addEventListener("click", () => (modal.style.display = "none"));
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        window.location.href = "succes.html";
    });
});
