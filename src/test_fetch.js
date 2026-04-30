const url = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hello&image_size=landscape_16_9";
fetch(url).then(res => {
  console.log("Status:", res.status);
  console.log("Headers:", res.headers);
}).catch(console.error);
