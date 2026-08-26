import 'should';
import { sqlNameToColumn } from '../src';

describe('SQL Name to Column Mapper', function() {
  describe('sqlNameToColumn', function() {
    it('should map column names correctly in a simple SELECT statement', function() {
      const sql = 'SELECT aa FROM b WHERE cc = dd';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        cc: 'c',
        dd: 'd',
      });
      answer.should.be.eql('SELECT a FROM b WHERE c = d');
    });

    it('should handle backticks and double quotes in column names', function() {
      const sql = 'SELECT `aa` FROM b WHERE cc = "d" AND `dd` = ee';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        cc: 'c',
        dd: 'd',
        ee: 'e',
      });
      answer.should.be.eql('SELECT `a` FROM b WHERE c = "d" AND `d` = e');
    });

    it('should handle aliases and arithmetic operations in column names', function() {
      const sql = 'SELECT `aa` AS k FROM b WHERE cc = "d" AND `dd` + `ee` = ee + 1';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        cc: 'c',
        dd: 'd',
        ee: 'e',
      });
      answer.should.be.eql('SELECT `a` AS k FROM b WHERE c = "d" AND `d` + `e` = e + 1');
    });

    it('should handle complex expressions with backticks and arithmetic operations', function() {
      const sql = 'SELECT `aa` AS k FROM b WHERE cc = "d" AND `dd` + `ee` = ee + `f_f`';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        cc: 'c',
        dd: 'd',
        ee: 'e',
        f_f: 'f',
      });
      answer.should.be.eql('SELECT `a` AS k FROM b WHERE c = "d" AND `d` + `e` = e + `f`');
    });

    it('should handle nested expressions with backticks and double quotes', function() {
      const sql = 'SELECT aa FROM b WHERE (`cc` = "b\\"" AND `dd` = `ee`) AND `ff`';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        cc: 'c',
        dd: 'd',
        ee: 'e',
        ff: 'f',
      });
      answer.should.be.eql('SELECT a FROM b WHERE (`c` = "b\\"" AND `d` = `e`) AND `f`');
    });

    it('should handle backticks and escaped double quotes', function() {
      const sql = 'SELECT aa FROM b WHERE `cc` = "b\\""';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        cc: 'c',
      });
      answer.should.be.eql('SELECT a FROM b WHERE `c` = "b\\""');
    });

    it('should handle incomplete backtick expressions', function() {
      const sql = 'SELECT aa FROM b WHERE `c';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        cc: 'c',
      });
      answer.should.be.eql('SELECT a FROM b WHERE `c');
    });

    it('should handle incomplete double quote expressions', function() {
      const sql = 'SELECT aa FROM b WHERE cc"1"';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        cc: 'c',
      });
      answer.should.be.eql('SELECT a FROM b WHERE c"1"');
    });

    it('should handle multiple column names in SELECT clause', function() {
      const sql = 'SELECT aa, dd FROM b WHERE `c`';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        dd: 'd',
      });
      answer.should.be.eql('SELECT a, d FROM b WHERE `c`');
    });

    it('should handle function calls with backticks in WHERE clause', function() {
      const sql = 'SELECT aa FROM b WHERE calc(`dd`) = `ee`';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        dd: 'd',
        ee: 'e',
      });
      answer.should.be.eql('SELECT a FROM b WHERE calc(`d`) = `e`');
    });

    it('should handle complex expressions with function calls and backticks', function() {
      const sql = 'SELECT aa FROM b WHERE calc(`dd`) = (gg)ee`ff`';
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        dd: 'd',
        ee: 'e',
        ff: 'f',
        gg: 'g',
      });
      answer.should.be.eql('SELECT a FROM b WHERE calc(`d`) = (g)e`f`');
    });

    it('should handle unclosed quotes in SQL string', function() {
      const sql = "SELECT aa FROM b WHERE cc = 'unclosed";
      const answer = sqlNameToColumn(sql, {
        aa: 'a',
        cc: 'c',
      });
      answer.should.be.eql("SELECT a FROM b WHERE c = 'unclosed");
    });
  });
});
