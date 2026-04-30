const url = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hello&image_size=landscape_16_9";
const proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
fetch(proxyUrl).then(async res => {
  console.log("Status:", res.status);
  console.log("Headers:", res.headers);
  const blob = await res.blob();
  console.log("Blob size:", blob.size);
}).catch(console.error);
