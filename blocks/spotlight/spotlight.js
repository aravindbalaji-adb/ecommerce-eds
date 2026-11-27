export default async function decorate(block) {
  const jsonLink = block.querySelector('a');
  const jsonUrl = jsonLink?.href;

  if (!jsonUrl) {
    console.error('Spot Light: Product JSON URL not found.');
    return;
  }

  try {
    const response = await fetch(jsonUrl);

    if (!response.ok) {
      throw new Error(`Unable to load products: ${response.status}`);
    }

    const json = await response.json();
    const products = Array.isArray(json?.data) ? json.data : [];

    // Remove authored JSON link
    block.innerHTML = '';

    if (!products.length) {
      console.warn('Spot Light: No products found.');
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'spot-light-grid';

    products.forEach((product) => {
      const imageUrl = product?.['Image URL'];
      const productId = product?.ID;
      const productTitle = product?.Title;

      // Skip products without required data
      if (!imageUrl || !productId) return;

      const item = document.createElement('a');
      item.className = 'spot-light-item';
      item.href = `/products/${encodeURIComponent(productId)}`;
      item.setAttribute(
        'aria-label',
        productTitle ? `View ${productTitle}` : 'View product',
      );

      const image = document.createElement('img');
      image.className = 'spot-light-image';
      image.src = imageUrl;
      image.alt = productTitle || 'Product';
      image.loading = 'lazy';
      image.decoding = 'async';

      // Remove item if image fails
      image.addEventListener('error', () => {
        item.remove();
      });

      item.append(image);
      grid.append(item);
    });

    // Don't add an empty grid
    if (grid.children.length) {
      block.append(grid);
    }
  } catch (error) {
    console.error('Spot Light block error:', error);
    block.innerHTML = '';
  }
}