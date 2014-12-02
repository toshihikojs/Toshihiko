var Toshihiko = require("../lib/toshihiko");
var Type = require("../lib/fieldType");
var toshihiko = new Toshihiko("test", "root", "");
var should = require('should');
describe("toshihiko",function(){
	describe("#execute",function(){
		it("crete table",function(done){
			var sql = "CREATE TABLE IF NOT EXISTS `test_ddl` ( `id` int(11) unsigned NOT NULL AUTO_INCREMENT, `ls` int(11) NOT NULL,PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
			toshihiko.execute(sql,function(err){
				(err === null).should.be.true;
				done();
			});
		});
		it("insert",function(done){
			var sql = "insert into test_ddl values(0,1)";
			toshihiko.execute(sql,function(err){
				(err === null).should.be.true;
				done();
			});
		});
		it("select rows",function(done){
			var sql = "select * from test_ddl";
			toshihiko.execute(sql,function(err,data){
				(err === null).should.be.true;
				data.should.be.an.Array;
				data.should.have.length(1);
				data.should.eql([{id:1,ls:1}]);
				done();
			});
		});
		it("delete table",function(done){
			var sql = "drop table test_ddl";
			toshihiko.execute(sql,function(err,data){
				(err === null).should.be.true;
				done();
			});
		});
	});
	describe("#definde",function(){
		it("should return model object",function(){
			var test = toshihiko.define("test", [
				{ name: "key1", column: "key_one", primaryKey: true, type: Type.Integer },
				{ name: "key2", type: Type.String, defaultValue: "Ha~" },
				{ name: "key3", type: Type.Json, defaultValue: [] },
				{ name: "key4", validators: [
					function(v) {
						if(v > 100) return "`key4` can't be greater than 100";
					}
				] }
			]);
			test.should.be.ok;
		});

	});
});