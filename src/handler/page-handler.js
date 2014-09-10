

var PageHandler = function() {

}

/**
 * Process a valid request
 */
PageHandler.prototype.doRequest = function(req, res, next) {

    var self = this;

    logger.info("Processing page request for " + req.url);

    self.pageResolver.findPage(req.url).then(function(page) {

        logger.info('Page found for ' + req.url + ': ' + page.id);

        var pageData = {};
        page.regions.forEach(function(region) {

            logger.log(region.module)

            var pageModule = region.module;

            var type = pageModule.type;
            var mod = self.parts.find(function(mod) {
                return mod.getType() === type;
            });

            pageData[region.region] = mod.read(pageModule.data, self.db);

            hbs.registerPartial(region.region, mod.userView);
        });

        res.render(page.template.src, pageData, function(err, html) {

            if(err) {
                logger.error(err);
                next();
            } else {
                logger.info("Sending page for %s", req.url)
                res.send(html);
            }
        });

    }).catch(function(err) {
        console.log(err);
        next();
    });
};
