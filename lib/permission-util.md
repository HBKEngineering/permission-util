<a name="factory"></a>
## factory()
A set of utilities for working with permissions data.

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

**Kind**: global function  

* [factory()](#factory)
    * [~unionHashes()](#factory..unionHashes)
    * [~inheritHashes()](#factory..inheritHashes)
    * [~parseType(type)](#factory..parseType) ⇒
    * [~findTypes(permissionSet)](#factory..findTypes) ⇒ <code>Array</code>
    * [~findActions(permissionSet, type)](#factory..findActions)
    * [~hasAction(permissionSet, type, action)](#factory..hasAction) ⇒
    * [~hasAnyAction(permissionSet, type, action)](#factory..hasAnyAction) ⇒
    * [~inherit()](#factory..inherit)
    * [~union()](#factory..union)

<a name="factory..unionHashes"></a>
### factory~unionHashes()
Unions two permissions hashes.

**Kind**: inner method of <code>[factory](#factory)</code>  
<a name="factory..inheritHashes"></a>
### factory~inheritHashes()
Creates a hash representing the child hash after inheriting any permissions from the parent hash.

**Kind**: inner method of <code>[factory](#factory)</code>  
<a name="factory..parseType"></a>
### factory~parseType(type) ⇒
Parse constraints used to query permissions.

**Kind**: inner method of <code>[factory](#factory)</code>  
**Returns**: A hash with type and producer specified as needed.  

| Param | Description |
| --- | --- |
| type | A string representing the type to query on, or a hash where the singular key is a type and its value is a model or id for the producer to query on. Pass null for any type. |

<a name="factory..findTypes"></a>
### factory~findTypes(permissionSet) ⇒ <code>Array</code>
Generates a set of types included in the permission set.

**Kind**: inner method of <code>[factory](#factory)</code>  
**Returns**: <code>Array</code> - The array of permission types contained in the permission set.  

| Param | Type | Description |
| --- | --- | --- |
| permissionSet | <code>permissionSet</code> | The permission set to inspect. |

<a name="factory..findActions"></a>
### factory~findActions(permissionSet, type)
Find the hash of actions for the given permission set and given type.

**Kind**: inner method of <code>[factory](#factory)</code>  

| Param | Description |
| --- | --- |
| permissionSet | A permission set, as provided by findPermissions. |
| type | A string representing the type to query on, or a hash where the singular key is a type and its value is a model or id for the producer to query on. Pass null for any type. |

<a name="factory..hasAction"></a>
### factory~hasAction(permissionSet, type, action) ⇒
Determine if the given permission set "allows" `action` on the given `type`.

**Kind**: inner method of <code>[factory](#factory)</code>  
**Returns**: true if `permissionSet` allows *all* actions on `type`, otherwise false.  

| Param | Description |
| --- | --- |
| permissionSet | A permission set. |
| type | A string representing the type to query on, or a hash where the singular key is a type and its value is a model or id for the producer to query on. Pass null for global. |
| action | A string or array of strings representing the action(s) to look for. |

<a name="factory..hasAnyAction"></a>
### factory~hasAnyAction(permissionSet, type, action) ⇒
Determine if the given permission set "allows" `action` on the given `type`.

**Kind**: inner method of <code>[factory](#factory)</code>  
**Returns**: true if `permissionSet` allows *any* of the actions on `type`, otherwise false.  

| Param | Description |
| --- | --- |
| permissionSet | A permission set. |
| type | A string representing the type to query on, or a hash where the singular key is a type and its value is a model or id for the producer to query on. Pass null for global. |
| action | A string or array of strings representing the action(s) to look for. |

<a name="factory..inherit"></a>
### factory~inherit()
Given a parent permission set and child permission set, generate a permission structure which
	maintains any permissions of the child while adding any permissions of the parent.

**Kind**: inner method of <code>[factory](#factory)</code>  
<a name="factory..union"></a>
### factory~union()
Union all permission sets provided.	This is an OR operation - if a single consumer has permission for something, the resultant set will indicate permission for something.

**Kind**: inner method of <code>[factory](#factory)</code>  
