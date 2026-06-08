module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css/output.css": "css/output.css" });
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy({ "favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "favicon.png": "favicon.png" });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes"
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk"
  };
};
