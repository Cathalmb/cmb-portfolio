module.exports = function(eleventyConfig) {
  // Only pass through compiled CSS — never source files
  eleventyConfig.addPassthroughCopy({ "src/css/output.css": "css/output.css" });
  eleventyConfig.addPassthroughCopy("images");

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
