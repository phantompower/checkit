var writewell = require('../lib/writewell.js');
var Promise = require('promise');

//FIXME: hack that fixes the tests, more info here: https://stackoverflow.com/questions/30683061/testing-synchronous-code
setInterval(function(){}, 10);

describe("writewell", function() {
  var writewell;

  beforeEach(function() {
    writewell = new writewell();
  });

  describe("addDictionary", function() {
    it("should require main (first) dictionary to have both dic and aff file", function() {
      expect(writewell.addDictionary.bind(writewell,'./dictionaries/en_GB.dic')).to.throw(/path must be a string/);
      expect(writewell.addDictionary.bind(writewell,'./dictionaries/en_GB.dic', './dictionaries/en_GB.aff')).not.to.throw();
    });

    it("should not require additional dictionaries to have aff file", function() {
      writewell.addDictionary('./dictionaries/en_GB.dic', './dictionaries/en_GB.aff');
      expect(writewell.addDictionary.bind(writewell,'./dictionaries/en_GB.dic')).not.to.throw();
    });
  });

  describe("setWhitelist", function() {
    it("should throw if something different than a string is provided", function () {
      expect(writewell.setWhitelist.bind(writewell, "p")).not.to.throw();
      expect(writewell.setWhitelist.bind(writewell, null)).to.throw(/must be a string/);
    });
  });

  describe("setBlacklist", function() {
    it("should throw if something different than a string is provided", function () {
      expect(writewell.setBlacklist.bind(writewell, "p")).not.to.throw();
      expect(writewell.setBlacklist.bind(writewell, null)).to.throw(/must be a string/);
    });
  });

  describe("setWriteGoodSettings", function() {
    it("should throw if something different than an object (or undefined) is provided", function () {
      expect(writewell.setWriteGoodSettings.bind(writewell, "")).to.throw();
      expect(writewell.setWriteGoodSettings.bind(writewell, {})).not.to.throw();
      expect(writewell.setWriteGoodSettings.bind(writewell)).not.to.throw();
    });
  });

  describe("proofread", function() {
    beforeEach(function() {
      writewell.addDictionary('./dictionaries/en_GB.dic', './dictionaries/en_GB.aff');
      writewell.setWhitelist('p');
    });

    it("should return a promise", function() {
      expect(writewell.proofread("")).to.be.an.instanceof(Promise);
    });

    it("should produce an array of suggestions", function() {
      return writewell.proofread("<p>Tezt.</p>").then(function(suggestions) {
        expect(suggestions).to.be.an.instanceof(Array);
        expect(suggestions[0]).to.have.all.keys('text', 'suggestions');
      });
    });

    it("should process only matching selectors", function() {
      return writewell.proofread("<h1>H1 tezt.</h1><p>Paragraph tezt.</p><div>H2 tezt.</div>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("Paragraph tezt.");
      });
    });

    it("should process all matching selectors", function() {
      return writewell.proofread("<p>Paragraph tezt1.</p><p>Paragraph tezt2.</p><p>Paragraph tezt3.</p>").then(function(suggestions) {
        expect(suggestions.length).to.be.equal(3);
      });
    });

    it("should remove blacklisted elements", function() {
      writewell.setBlacklist('code');
      return writewell.proofread("<p>A tezt <code>some code</code>.</p>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A tezt .");
      });
    });

    it("should reduce number of whitespace characters", function() {
      return writewell.proofread("<p>A    tezt.</p>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A tezt.");
      });
    });

    it("should replace endline characters with spaces", function() {
      var text = "<p>A \
      tezt.\r\nAnd another one.</p>";

      return writewell.proofread(text).then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A tezt. And another one.");
      });
    });

    it("should replace ’ with '", function() {
      return writewell.proofread("<p>A ’tezt’.</p>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A 'tezt'.");
      });
    });

    it("should trim text", function() {
      return writewell.proofread("<p>  A tezt.     </p>").then(function(suggestions) {
        expect(suggestions[0].text).to.be.equal("A tezt.");
      });
    });

    it("should work without a dictionary", function() {
      var writewell = new writewell();
      writewell.setWhitelist("p");

      return writewell.proofread("<p>The cat was stolen.</p>").then(function(paragraphs) {
        expect(paragraphs[0].suggestions.spelling.length).to.be.equal(0);
        expect(paragraphs[0].suggestions.writeGood.length).not.to.be.equal(0);
      });
    });

    it("should use provided write-good settings", function () {
      writewell.setWriteGoodSettings({passive: false});

      return writewell.proofread("<p>The cat was stolen.</p>").then(function(paragraphs) {
        expect(paragraphs[0].suggestions.writeGood.length).to.be.equal(0);
      });
    });
  });
});
