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

    // Filter only spotlight items
    const spotlightProducts = products.filter(
      (product) => product?.type?.trim().toLowerCase() === 'spotlight',
    );

    if (!spotlightProducts.length) {
      console.warn('Spot Light: No spotlight products found.');
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'spotlight-grid';

    spotlightProducts.forEach((product) => {
      const imageUrl = product?.['image-url'];
      const productId = product?.id;
      const productTitle = product?.title;

      // Skip item if required data is missing
      if (!imageUrl || !productId) return;

      const item = document.createElement('a');
      item.className = 'spotlight-item';
      item.href = `/products/${encodeURIComponent(productId)}`;

      item.setAttribute(
        'aria-label',
        productTitle
          ? `View ${productTitle}`
          : `View product ${productId}`,
      );

      const image = document.createElement('img');
      image.className = 'spotlight-image';
      image.src = imageUrl;
      image.alt = productTitle || `Product ${productId}`;
      image.loading = 'lazy';
      image.decoding = 'async';

      // Remove item if image fails to load
      image.addEventListener('error', () => {
        item.remove();
      });

      item.append(image);
      grid.append(item);
    });

    // Add grid only when valid items exist
    if (grid.children.length) {
      block.append(grid);
    }
  } catch (error) {
    console.error('Spot Light block error:', error);
    block.innerHTML = '';
  }
}