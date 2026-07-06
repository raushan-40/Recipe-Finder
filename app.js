/**
 * Artisan Cheese Shop - Recipe Finder Core Logic
 * Fully client-side search execution simulating asynchronous server latency.
 */

// ==========================================================================
// 1. DATA STORE (In-Memory Mock Database)
// ==========================================================================
const RECIPE_DB = [
  {
    id: 1,
    title: "Classic Gruyère & Emmental Fondue",
    category: "Appetizer",
    cheeseUsed: "Gruyère, Emmental",
    prepTime: "20 mins",
    ingredients: [
      "200g Gruyère cheese (grated)",
      "200g Emmental cheese (grated)",
      "1 Garlic clove (cut in half)",
      "150ml Dry white wine",
      "1 tsp Cornstarch",
      "1 tbsp Kirsch (optional)"
    ],
    instructions: "Rub the interior of a heavy fondue pot with the cut side of garlic. Whisk wine and cornstarch in the pot over medium heat. Gradually add grated Gruyère and Emmental, stirring constantly in a figure-eight pattern until melted and creamy. Serve immediately with warm bread cubes."
  },
  {
    id: 2,
    title: "Artisan Gouda Macaroni & Cheese",
    category: "Main Course",
    cheeseUsed: "Smoked Gouda, Sharp Cheddar",
    prepTime: "45 mins",
    ingredients: [
      "250g Dried macaroni",
      "150g Smoked Gouda (shredded)",
      "150g Sharp Cheddar (shredded)",
      "50g Unsalted butter",
      "2 tbsp All-purpose flour",
      "300ml Whole milk",
      "50g Breadcrumbs"
    ],
    instructions: "Cook macaroni. In a separate pan, melt butter and whisk in flour for 1 minute. Slowly stream in whole milk, stirring constantly until thick. Stir in the cheeses until completely melted. Combine cooked macaroni with cheese sauce, transfer to a baking dish, top with breadcrumbs, and bake at 190°C (375°F) for 20 minutes."
  },
  {
    id: 3,
    title: "Blue Cheese and Pear Salad",
    category: "Salad",
    cheeseUsed: "Roquefort or Gorgonzola",
    prepTime: "10 mins",
    ingredients: [
      "150g Mixed organic greens",
      "1 Large ripe pear (thinly sliced)",
      "100g Gorgonzola cheese (crumbled)",
      "50g Toasted walnuts",
      "2 tbsp Extra virgin olive oil",
      "1 tbsp Balsamic vinegar"
    ],
    instructions: "Arrange fresh mixed salad greens on service plates. Evenly distribute the thinly sliced fresh pears, crumbled blue cheese, and toasted walnuts. Drizzle with combined olive oil and balsamic vinegar immediately prior to table service."
  },
  {
    id: 4,
    title: "Chèvre Crostini with Honey and Thyme",
    category: "Appetizer",
    cheeseUsed: "Chèvre (Fresh Goat Cheese)",
    prepTime: "15 mins",
    ingredients: [
      "1 French baguette (sliced)",
      "150g Fresh goat cheese (Chèvre)",
      "2 tbsp Raw honey",
      "1 tbsp Fresh thyme leaves",
      "1 tbsp Olive oil"
    ],
    instructions: "Preheat oven to 180°C (356°F). Brush baguette slices lightly with olive oil and toast for 8 minutes until golden and crisp. Spread a generous portion of goat cheese on each slice. Drizzle with natural honey and garnish with fresh thyme."
  }
];

// ==========================================================================
// 2. DOM ELEMENT REFERENCE SELECTORS
// ==========================================================================
const searchForm = document.getElementById("recipe-search-form");
const searchInput = document.getElementById("search-input");
const inputErrorMsg = document.getElementById("input-error");
const displayContainer = document.getElementById("recipe-display-container");
const ariaAnnouncer = document.getElementById("aria-announcer");

// ==========================================================================
// 3. UTILITY FUNCTIONS (Security & Helper Logic)
// ==========================================================================

/**
 * Mitigates XSS injection risks by encoding dynamic text prior to rendering.
 * @param {string} rawString - The unverified user or DB input.
 * @returns {string} Safe HTML string.
 */
function sanitizeInput(rawString) {
  if (!rawString) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;"
  };
  return String(rawString).replace(/[&<>"'/]/g, (match) => map[match]);
}

/**
 * Validates search syntax. Allows only standard letters, spaces, and hyphens.
 * @param {string} value - Search query.
 * @returns {boolean} True if clean and valid, false if malformed or containing forbidden characters.
 */
function isValidSearchQuery(value) {
  const trimmed = value.trim();
  // Reject empty inputs or strings with malicious payloads
  if (trimmed === "") return false;
  
  // Custom RegEx constraints to ensure floor staff cannot execute SQL or XSS scripts
  const permittedCharsPattern = /^[a-zA-Z0-9\s\-\,\&\']+$/;
  return permittedCharsPattern.test(trimmed);
}

/**
 * Logs interface metrics for telemetry purposes.
 * @param {string} actionName 
 * @param {object} metadata 
 */
function trackTelemetry(actionName, metadata = {}) {
  console.log(`[Analytics] User interacted with Recipe Finder | Action: ${actionName}`, metadata);
}

// ==========================================================================
// 4. API SIMULATION ENGINE (With Latency Simulation)
// ==========================================================================

/**
 * Simulates real-time network latency (3G speed) and filters local results.
 * @param {string} query - Clean query argument.
 * @returns {Promise<Array>} List of recipes matching the search parameters.
 */
function simulateApiFetch(query) {
  return new Promise((resolve) => {
    const delayDuration = 1200; // Simulated latency
    const normalizedQuery = query.toLowerCase().trim();

    setTimeout(() => {
      const results = RECIPE_DB.filter(recipe => {
        return (
          recipe.title.toLowerCase().includes(normalizedQuery) ||
          recipe.cheeseUsed.toLowerCase().includes(normalizedQuery) ||
          recipe.ingredients.some(ing => ing.toLowerCase().includes(normalizedQuery))
        );
      });
      resolve(results);
    }, delayDuration);
  });
}

// ==========================================================================
// 5. VIEW RENDERING ENGINE
// ==========================================================================

/**
 * Mounts the loading state to the viewport.
 */
function renderLoadingState() {
  displayContainer.setAttribute("aria-busy", "true");
  displayContainer.innerHTML = `
    <div class="spinner-container" role="alert" aria-busy="true">
      <div class="spinner"></div>
      <p class="loading-text">Fetching current artisan recipes...</p>
    </div>
  `;
}

/**
 * Mounts the empty state if no inventory corresponds to query.
 * @param {string} query 
 */
function renderNoResultsState(query) {
  displayContainer.setAttribute("aria-busy", "false");
  
  const sanitizedQuery = sanitizeInput(query);
  displayContainer.innerHTML = `
    <div class="empty-state">
      <p>No culinary recipes found in cheese inventory database matching: "<strong>${sanitizedQuery}</strong>"</p>
      <p>Verify spelling or search for standard varieties (e.g., Gouda, Gruyère, Chèvre, Pear).</p>
    </div>
  `;
}

/**
 * Populates and updates the DOM grid container with standard recipe items.
 * @param {Array} recipes - Sanitized array of objects.
 */
function renderRecipes(recipes) {
  displayContainer.setAttribute("aria-busy", "false");
  displayContainer.innerHTML = "";

  recipes.forEach(recipe => {
    const card = document.createElement("article");
    card.className = "recipe-card";
    
    // Construct isolated strings safely via innerText / element properties
    const titleText = sanitizeInput(recipe.title);
    const categoryText = sanitizeInput(recipe.category);
    const cheeseText = sanitizeInput(recipe.cheeseUsed);
    const prepTimeText = sanitizeInput(recipe.prepTime);
    const instructionsText = sanitizeInput(recipe.instructions);

    // Build ingredient list elements programmatically to eliminate vulnerability vectors
    const listItems = recipe.ingredients
      .map(ingredient => `<li>${sanitizeInput(ingredient)}</li>`)
      .join("");

    card.innerHTML = `
      <div class="recipe-card-header">
        <span class="recipe-badge">${categoryText}</span>
        <h3 class="recipe-title">${titleText}</h3>
        <p class="recipe-metadata"><strong>Primary Cheese:</strong> ${cheeseText} | <strong>Prep:</strong> ${prepTimeText}</p>
      </div>
      <div class="recipe-body">
        <p class="ingredients-title">Ingredients</p>
        <ul class="ingredients-list">
          ${listItems}
        </ul>
        <p class="ingredients-title">Preparation Method</p>
        <p class="instructions-text">${instructionsText}</p>
      </div>
    `;
    displayContainer.appendChild(card);
  });
}

// ==========================================================================
// 6. EVENT BINDING & STATE MANAGEMENT
// ==========================================================================

/**
 * Handle form execution lifecycle.
 */
async function handleSearchExecution(event) {
  event.preventDefault();
  
  const query = searchInput.value;

  // Clear previous validation error highlights
  searchInput.classList.remove("is-invalid");
  inputErrorMsg.classList.remove("is-visible");
  inputErrorMsg.textContent = "";

  // Validation phase
  if (!isValidSearchQuery(query)) {
    searchInput.classList.add("is-invalid");
    inputErrorMsg.classList.add("is-visible");
    
    if (query.trim() === "") {
      inputErrorMsg.textContent = "Search field cannot be empty. Please type a cheese name.";
    } else {
      inputErrorMsg.textContent = "Query contains prohibited characters. Use letters, numbers, and standard symbols only.";
    }
    
    searchInput.focus();
    return;
  }

  // Telemetry registration
  trackTelemetry("ExecuteSearch", { queryLength: query.trim().length });

  // Loading phase initiation
  renderLoadingState();
  ariaAnnouncer.textContent = "Loading recipe inventory database. Please wait.";

  try {
    const matches = await simulateApiFetch(query);
    
    if (matches.length === 0) {
      renderNoResultsState(query);
      ariaAnnouncer.textContent = `No recipes matches found for ${query}.`;
    } else {
      renderRecipes(matches);
      ariaAnnouncer.textContent = `Search successful. Rendered ${matches.length} matches for ${query}.`;
    }
  } catch (err) {
    // Graceful production fallback for operational staff
    console.error("[System Error] Database fetch failed", err);
    displayContainer.innerHTML = `
      <div class="empty-state" style="border-color: var(--color-danger)">
        <p style="color: var(--color-danger)">A technical database connectivity failure has occurred.</p>
        <p>Please contact floor administrative systems if issues persist.</p>
      </div>
    `;
    ariaAnnouncer.textContent = "A server connection error occurred. Search operation aborted.";
  }
}

// Form event registration
searchForm.addEventListener("submit", handleSearchExecution);