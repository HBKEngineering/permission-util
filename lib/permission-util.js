/**A set of utilities for working with permissions data.

//Format
Each public function provided by this utility operates on an object known as a permission set. This is a hash with one entry "_global" specifying the json of global permissions, as well as one entry for each type. Entries for each type consist of a hash with one entry "_global" specifying a hash of permissions that apply to all producers of that type, combined with one entry for each specified producer, which contains the permissions hash.

The hash of permissions or actions should have keys for each "verb" with values of whether to allow or deny that verb. For instance:
    `{'read': true, 'update': false}`
Would indicate that the permission allowed reading but disallowed updating. In addition, actions excluded are false by default. The *most* specific permission takes precedence.

An example permission set is as follows:
```
    {
    	_global: {'read': true},
    	'type1': {
    		_global: {'read': true, 'activate': true},
    		'1': {'write': true, 'read': true}
    	}
    }
```

For a given consumer, a permission set such as this would indicate that they have global read permissions, and additionally can "activate" anything of `type`. Lastly, they are allowed to "write" to the object of id 1 of type `type`.    
*/

function factory(_){
	/**Unions two permissions hashes.*/
	function unionHashes(first, second){
		var result = {};
		var firstKeys, secondKeys;
	  
		if(_.isObject(first)){
			firstKeys = _.keys(first);
		} else {
			firstKeys = [];
			first = {};
		}

		if(_.isObject(second)){
			secondKeys = _.keys(second);
		} else {
			secondKeys = [];
			second = {};
		}

		var union = _.union(firstKeys, secondKeys);  
		var result = {};

		_.each(union, function(key){
			result[key] = first[key] || second[key];
		});

		return result;
	}

	/**Creates a hash representing the child hash after inheriting any permissions from the parent hash.*/
	function inheritHashes(child, parent){
		var result = {};
		var childKeys, parentKeys;

		if(_.isObject(child)){
			childKeys = _.keys(child);
		} else {
			childKeys = [];
			child = {};
		}

		if(_.isObject(parent)){
			parentKeys = _.keys(parent);
		} else {
			parentKeys = [];
			parent = {};
		}

		var onlyParentKeys = _.difference(parentKeys, childKeys);

		_.each(onlyParentKeys, function(key){
			result[key] = parent[key];
		});
		_.each(childKeys, function(key){
			if(_.isBoolean(child[key])){
				result[key] = child[key];
			} else {
				result[key] = parent[key];
			}
		});

		return result;
	}

	function removeGlobal(keys){
		var idx = keys.indexOf('_global');

		if(idx != -1){
			keys.splice(idx, 1);
		}

		return keys;
	}

	/**Parse constraints used to query permissions. 
	   @param type A string representing the type to query on, or a hash where the singular key is a type and its value is a model or id for the producer to query on. Pass null for any type.
	   @returns A hash with type and producer specified as needed.*/
	function parseType(type){
		var constraints = {};

		if(type){
			if(_.isObject(type)){
				_.each(type, function(producer, type){
					constraints.type = type;
					constraints.producer = _.isObject(producer) ? producer.id : producer;
				});
			} else {
				constraints.type = type;
			}
		}

		return constraints;
	}

	/**
	 * Generates a set of types included in the permission set.
	 * @param  {permissionSet} permissionSet The permission set to inspect.
	 * @return {Array}               The array of permission types contained in the permission set.
	 */
	function findTypes(permissionSet){
		var results = [];

		if(!_.isEmpty(permissionSet._global)){
			results.push({});
		}

		_.each(_.without(_.keys(permissionSet), '_global'), function(typeKey){
			if(!_.isEmpty(permissionSet[typeKey]._global)){
				results.push(typeKey);
			}

			_.each(_.without(_.keys(permissionSet[typeKey]), '_global'), function(producer){
				if(!_.isEmpty(permissionSet[typeKey][producer])){
					var result = {};
					
					result[typeKey] = producer;
					results.push(result);
				}
			});
		});

		return results;
	}

	/**Find the hash of actions for the given permission set and given type.
	   @param permissionSet A permission set, as provided by findPermissions.
	   @param type A string representing the type to query on, or a hash where the singular key is a type and its value is a model or id for the producer to query on. Pass null for any type.*/
	function findActions(permissionSet, type, cb){
		//need to find the most specific valid hash.
		var constraints = parseType(type);
		var hash;
		var currentHash;

		if(_.isObject(permissionSet)){
			hash = permissionSet._global || {};

			if(constraints.type){
				currentHash = permissionSet[constraints.type];

				if(currentHash){
					hash = inheritHashes(currentHash._global, hash);

					if(constraints.producer){
						currentHash = permissionSet[constraints.type][constraints.producer];

						if(currentHash){
							hash = inheritHashes(currentHash, hash);
						}
					}
				}
			}
		} else {
			hash = {};
		}

		return hash;
	}

	/**Determine if the given permission set "allows" `action` on the given `type`.
	   @param permissionSet A permission set.
	   @param type A string representing the type to query on, or a hash where the singular key is a type and its value is a model or id for the producer to query on. Pass null for global. 
	   @param action A string or array of strings representing the action(s) to look for.
	   @return true if `permissionSet` allows *all* actions on `type`, otherwise false.*/
	function hasAction(permissionSet, type, action){
		var hash = findActions(permissionSet, type);

		if(!_.isArray(action)){
			action = [action];
		}

		if(action.length){
			return _.every(action, function(action){
				return hash[action];
			});
		} else {
			return false;
		}
	}

	/**Determine if the given permission set "allows" `action` on the given `type`.
	   @param permissionSet A permission set.
	   @param type A string representing the type to query on, or a hash where the singular key is a type and its value is a model or id for the producer to query on. Pass null for global. 
	   @param action A string or array of strings representing the action(s) to look for.
	   @return true if `permissionSet` allows *any* of the actions on `type`, otherwise false.*/
	function hasAnyAction(permissionSet, type, action){
		var hash = findActions(permissionSet, type);

		if(!_.isArray(action)){
			action = [action];
		}

		if(action.length){
			return _.some(action, function(action){
				return hash[action];
			});
		}	else {
			return false;
		}
	}

	/**
	Given a parent permission set and child permission set, generate a permission structure which
	maintains any permissions of the child while adding any permissions of the parent.
	*/
	function inherit(childPerms, parentPerms){
		var result = {
			_global: {}
		};

		childPerms = childPerms || {};
		parentPerms = parentPerms || {};
		result._global = inheritHashes(childPerms._global, parentPerms._global);
		var allKeys = _.union(_.keys(childPerms), _.keys(parentPerms));

		allKeys = _.without(allKeys, '_global');
		_.each(allKeys, function(key){
			result[key] = {
				_global: {}
			};

			if(!childPerms[key]){
				result[key] = parentPerms[key];
			} else if(!parentPerms[key]){
				result[key] = childPerms[key];
			} else {
				result[key]._global = inheritHashes(childPerms[key]._global, parentPerms[key]._global);
				var allKeys = _.union(_.keys(childPerms[key]), _.keys(parentPerms[key]));

				allKeys = _.without(allKeys, '_global');
				_.each(allKeys, function(innerKey){
					result[key][innerKey] = inheritHashes(childPerms[key][innerKey], parentPerms[key][innerKey]);
				});
			}
		});

		return result;
	}

	/**
	Union all permission sets provided.	This is an OR operation - if a single consumer has permission for something, the resultant set will indicate permission for something.
	*/
	function union(permissionSets){		
		var result = {
			_global: {}
		};

		if(!_.isArray(permissionSets)){
			return permissionSets;
		}

		_.each(permissionSets, function(item){
			item = item || {};
			result._global = unionHashes(result._global, item._global);
			var keys = removeGlobal(_.keys(item));

			_.each(keys, function(key){
				if(!result[key]){
					result[key] = {
						_global: {}
					};
				}

				result[key]._global = unionHashes(result[key]._global, item[key]._global);
				var keys = removeGlobal(_.keys(item[key]));

				_.each(keys, function(innerKey){
					result[key][innerKey] = unionHashes(result[key][innerKey], item[key][innerKey]);
				});
			});
		});

		return result;
	}

	return {
		inherit: inherit,
		union: union,
		hasAnyAction: hasAnyAction,
		hasAction: hasAction,
		findActions: findActions,
		parseType: parseType,
		inheritHashes: inheritHashes,
		unionHashes: unionHashes,
		findTypes: findTypes
	};	
}

if((typeof module) != 'undefined'){
	module.exports = factory(require('underscore'));
} else {
	/*global define*/
	define(['underscore'], factory);
}
