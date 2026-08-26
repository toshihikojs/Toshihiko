import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { escape, escapeLike } from '../src';

describe('SQL Escaper', function() {
  describe('escape', function() {
    it('should escape single quotes', function() {
      const input = 'McDonald\'s';
      const expected = 'McDonald\\\'s';
      assert.equal(escape(input), expected);
    });

    it('should escape double quotes', function() {
      const input = 'pa"ssw"ord';
      const expected = 'pa\\"ssw\\"ord';
      assert.equal(escape(input), expected);
    });

    it('should escape backslashes', function() {
      const input = 'C:\\Users\\John';
      const expected = 'C:\\\\Users\\\\John';
      assert.equal(escape(input), expected);
    });

    it('should escape newlines and tabs', function() {
      const input = 'line1\nline2\tcolumn';
      const expected = 'line1\\nline2\\tcolumn';
      assert.equal(escape(input), expected);
    });

    it('should handle null byte and other special characters', function() {
      const input = 'special\0\r\b\x1acharacters';
      const expected = 'special\\0\\r\\b\\Zcharacters';
      assert.equal(escape(input), expected);
    });

    it('should return non-string inputs as-is', function() {
      const input = 42;
      assert.equal(escape(input as any), input);
    });

    it('should handle mixed special characters', function() {
      const input = 'It\'s "complicated" \\n\r';
      const expected = 'It\\\'s \\"complicated\\" \\\\n\\r';
      assert.equal(escape(input), expected);
    });
  });

  describe('escapeLike', function() {
    it('should escape underscore', function() {
      const input = 'John_Doe';
      const expected = 'John\\_Doe';
      assert.equal(escapeLike(input), expected);
    });

    it('should escape percent sign', function() {
      const input = '100% natural';
      const expected = '100\\% natural';
      assert.equal(escapeLike(input), expected);
    });

    it('should not escape other characters', function() {
      const input = 'Regular string';
      assert.equal(escapeLike(input), input);
    });

    it('should handle mixed special characters', function() {
      const input = '50%_discount';
      const expected = '50\\%\\_discount';
      assert.equal(escapeLike(input), expected);
    });
  });
});
