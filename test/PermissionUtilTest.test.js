


describe('PermissionUtil', function(){
	global._ = require('underscore');
	var PermissionUtil = require('../lib/permission-util');
	var assert = require('chai').assert;

	var permSet1 = {
        _global: {'read': true},
        'type1': {
            _global: {'read': true, 'activate': true},
            '1': {'write': true, 'read': true}
        }
    };

    var permSet2 = {
        _global: {'write': true},
        'type1': {
            _global: {'read': true, 'activate': false},
            '1': {'write': true, 'read': true},
            '2': {'read': true}
        },
        'type2': {
        	_global: {'read': true},
        	'1': {'read': true},
        	'2': {'read': false}
        }
    };

    describe('#unionHashes', function(){
    	it('ignores boolean arguments', function(){
    		assert.isObject(PermissionUtil.unionHashes(true, false));
    	});
    	it('gracefully handles a null first argument', function(){
    		assert.isObject(PermissionUtil.unionHashes(null, {'read': true}));
    	});
    	it('gracefully handles a null second argument', function(){
    		assert.isObject(PermissionUtil.unionHashes({'read': true}, null));
    	});
    	it('unions distinct keys and values for both objects', function(){
    		var hash = PermissionUtil.unionHashes({'read': true}, {'write': true, 'view': false});
    		assert.isBoolean(hash.read);
    		assert(hash.read);
    		assert.isBoolean(hash.write);
    		assert(hash.write);
    		assert.isBoolean(hash.view);
    		assert(!hash.view);
    	});
    	it('properly overrides matching false key values', function(){
    		var hash = PermissionUtil.unionHashes({'write': true}, {'write': false});
    		assert(hash.write);
    	});
    });

    describe('#inheritHashes', function(){
    	it('ignores boolean arguments', function(){
    		assert.isObject(PermissionUtil.inheritHashes(true, false));
    	});
    	it('gracefully handles a null first argument', function(){
    		assert.isObject(PermissionUtil.inheritHashes(null, {'read': true}));    		
    	});
    	it('gracefully handles a null second argument', function(){
    		assert.isObject(PermissionUtil.inheritHashes({'read': true}, null));
    	});
    	it('unions distinct keys and values for both objects', function(){
    		var hash = PermissionUtil.inheritHashes({'read': true}, {'write': true, 'view': false});
    		assert.isBoolean(hash.read);
    		assert(hash.read);
    		assert.isBoolean(hash.write);
    		assert(hash.write);
    		assert.isBoolean(hash.view);
    		assert(!hash.view);
    	});
    	it('retains the child value for matching settings', function(){
    		var hash = PermissionUtil.inheritHashes({'write': true}, {'write': false});
    		var hash2 = PermissionUtil.inheritHashes({'write': false}, {'write': true});
    		assert(hash.write);
    		assert(!hash2.write);
    	});
    });

	describe('#parseType', function(){
		it('gracefully handles a null type', function(){
			assert.isObject(PermissionUtil.parseType(null));
		});
		it('returns a passed string as a type attribute', function(){
			var result = PermissionUtil.parseType('Model');
			assert.equal('Model', result.type);
		});
		it('properly handles a map argument', function(){
			var result = PermissionUtil.parseType({'Model': 'id'});
			assert.equal('Model', result.type);
			assert.equal('id', result.producer);
		});
	});

	describe('#findActions', function(){
		it('handles a null type as specified', function(){
			var result = PermissionUtil.findActions(permSet1, null);
			assert(result.read === true);
		});
		it('handles a string type as specified', function(){
			var result = PermissionUtil.findActions(permSet1, 'type1');
			assert(result.read === true);
			assert(result.activate === true);
		});
		it('handles a map type as specified', function(){
			var result = PermissionUtil.findActions(permSet1, {'type1': '1'});
			assert(result.read === true);
			assert(result.write === true);
		});
		it('defaults to string type result for nonexistent map types', function(){
			var result = PermissionUtil.findActions(permSet1, {'type1': 'nofind'});
			assert(result.read === true);
			assert(result.activate === true);
		});
		it('defaults to null type result for nonexistent string types', function(){
			var result = PermissionUtil.findActions(permSet1, 'nofind');
			assert(result.read === true);
		});
		it('fails gracefully for invalid permission sets', function(){
			assert.isObject(PermissionUtil.findActions(null, 'something'));
		});		
	});

	describe('#hasAction', function(){
		it('handles a null type as expected', function(){
			var result = PermissionUtil.hasAction(permSet1, null, 'read');
			assert.equal(result, true);
		});
		it('handles a string type as expected', function(){
			var result = PermissionUtil.hasAction(permSet1, 'type1', 'activate');
			assert.equal(result, true);
		});
		it('handles a map type as expected', function(){
			var result = PermissionUtil.hasAction(permSet1, {'type1': '1'}, 'write');
			assert.equal(result, true);
		});
		it('returns true if all actions are allowed', function(){
			var result = PermissionUtil.hasAction(permSet1, 'type1', ['activate', 'read']);
			assert.equal(result, true);
		});
		it('returns false for nonexistent actions', function(){
			var result = PermissionUtil.hasAction(permSet1, 'type1', 'squirrel');
			assert.equal(result, false);
		});
		it('returns false if any actions are not allowed', function(){
			var result = PermissionUtil.hasAction(permSet1, 'type1', ['activate', 'squirrel']);
			assert.equal(result, false);
		});
	});

	describe('#hasAnyAction', function(){
		it('handles a null type as expected', function(){
			var result = PermissionUtil.hasAnyAction(permSet1, null, 'read');
			assert.equal(result, true);
		});
		it('handles a string type as expected', function(){
			var result = PermissionUtil.hasAnyAction(permSet1, 'type1', 'activate');
			assert.equal(result, true);
		});
		it('handles a map type as expected', function(){
			var result = PermissionUtil.hasAnyAction(permSet1, {'type1': '1'}, 'write');
			assert.equal(result, true);
		});
		it('returns false if no actions are allowed', function(){
			var result = PermissionUtil.hasAnyAction(permSet1, 'type1', ['activates', 'reads']);
			assert.equal(result, false);
		});
		it('returns false for nonexistent actions', function(){
			var result = PermissionUtil.hasAnyAction(permSet1, 'type1', 'squirrel');
			assert.equal(result, false);
		});
		it('returns true if any actions are allowed', function(){
			var result = PermissionUtil.hasAnyAction(permSet1, 'type1', ['activate', 'squirrel']);
			assert.equal(result, true);
		});
	});

	describe('#inherit', function(){
		it('ignores boolean arguments', function(){
			assert.isObject(PermissionUtil.inherit(true, false));
		});
		it('gracefully handles a null first argument', function(){
			assert.deepEqual(PermissionUtil.inherit(null, permSet1), permSet1);
		});
		it('gracefully handles a null second argument', function(){
			assert.isObject(PermissionUtil.inherit(permSet1, null), permSet1);
		});
		it('works as defined for valid arguments', function(){
			var hash = PermissionUtil.inherit(permSet1, permSet2);
			assert.deepEqual(hash, {
				_global: {'write': true, 'read': true},
				'type1': {
					_global: {'read': true, 'activate': true},
					'1': {'write': true, 'read': true},
					'2': {'read': true}
				},
				'type2': {
					_global: {'read': true},
					'1': {'read': true},
					'2': {'read': false}
				}
			});
		});

		it('works as defined for valid arguments 2', function(){
			var hash = PermissionUtil.inherit(permSet2, permSet1);
			assert.deepEqual(hash, {
				_global: {'write': true, 'read': true},
				'type1': {
					_global: {'read': true, 'activate': false},
					'1': {'write': true, 'read': true},
					'2': {'read': true}
				},
				'type2': {
					_global: {'read': true},
					'1': {'read': true},
					'2': {'read': false}
				}
			});
		});
	});

	describe('#union', function(){
		it('ignores boolean arguments', function(){
			assert.isObject(PermissionUtil.union([true, false]));
		});
		it('gracefully handles a null first argument', function(){
			assert.deepEqual(PermissionUtil.union([null, permSet1]), permSet1);
		});
		it('gracefully handles a null second argument', function(){
			assert.isObject(PermissionUtil.union([permSet1, null]), permSet1);
		});
		it('works as defined for valid arguments', function(){
			var hash = PermissionUtil.union([permSet1, permSet2]);
			assert.deepEqual(hash, {
				_global: {'write': true, 'read': true},
				'type1': {
					_global: {'read': true, 'activate': true},
					'1': {'write': true, 'read': true},
					'2': {'read': true}
				},
				'type2': {
					_global: {'read': true},
					'1': {'read': true},
					'2': {'read': false}
				}
			});
		});

		it('works as defined for valid arguments 2', function(){
			var hash = PermissionUtil.union([permSet2, permSet1]);
			assert.deepEqual(hash, {
				_global: {'write': true, 'read': true},
				'type1': {
					_global: {'read': true, 'activate': true},
					'1': {'write': true, 'read': true},
					'2': {'read': true}
				},
				'type2': {
					_global: {'read': true},
					'1': {'read': true},
					'2': {'read': false}
				}
			});
		});
	});
});