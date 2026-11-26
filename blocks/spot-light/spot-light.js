export default async function decorate(block) {
  const jsonLink = block.querySelector('a');
  const jsonUrl = jsonLink?.href;

  if (!jsonUrl) {
    console.error('Product JSON URL not found.');
    return;
  }

  try {
    const response = await fetch(jsonUrl);

    if (!response.ok) {
      throw new Error(`Unable to load products: ${response.status}`);
    }

    const json = await response.json();
    const products = json.data || [];

    // Remove original JSON URL content
    block.innerHTML = '';

    // Product grid
    const grid = document.createElement('div');
    grid.className = 'spot-light-grid';

    products.forEach((product) => {
      const imageUrl = product['Image URL'];

      // Skip product if image is missing
      if (!imageUrl) return;

      // Clickable product item
      const item = document.createElement('a');
      item.className = 'spot-light-item';
      item.href = `/products/${product.ID}`;

      // Product image
      const image = document.createElement('img');
      image.className = 'spot-light-image';
      image.src = imageUrl;
      image.alt = product.Title || 'Product';
      image.loading = 'lazy';

      item.append(image);
      grid.append(item);
    });

    block.append(grid);
  } catch (error) {
    console.error('Spot Light block error:', error);
  }
}