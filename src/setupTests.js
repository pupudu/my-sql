/**
 * Created by pubudud on 9/1/17.
 */

Error.prototype.appendDetails = function (className, method, cause) {
    this.path = `${(this.path || '#')} -> [${className}]|(${method})`;
    this.causes = `${(this.causes || '#')} -> (${method})|${cause}`;
};

