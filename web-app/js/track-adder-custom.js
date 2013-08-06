/**
 * Convert concept node key to DAS data source
 * @param key
 * @returns {string}
 */
function convertConceptKeyToDASSource (key) {
    // TODO translate concept key to DAS source with mapping
    return "acgh";
}

/**
 *
 * @param node
 * @param result_instance_id_1
 */
Browser.prototype.addTrackByNode = function(concept, result_instance_id_1, result_instance_id_2) {

    var thisB = this;
    var track_label, das_source;
    var res_inst_id_1, res_inst_id_2;

    console.log("concept", concept);

    // validate concept code
    if (!concept) {
        alert("Cannot add track. Cannot recognize concept node.");
        return
    } else {
        track_label = concept.name;
        das_source =  convertConceptKeyToDASSource(concept.key);
    }

    // validate result instance ids
    if (!result_instance_id_1 && !result_instance_id_2) {

        // get result instance id as representative of cohort selection
        // in Comparison tab
        runAllQueries(function () {

            console.log(GLOBAL.CurrentSubsetIDs[1]);
            console.log(GLOBAL.CurrentSubsetIDs[2]);

            res_inst_id_1 = GLOBAL.CurrentSubsetIDs[1];
            res_inst_id_2 = GLOBAL.CurrentSubsetIDs[2];

            var curi = "http://www.derkholm.net:8080/das/hsa_54_36p/";
            var transmart_curi = pageInfo.basePath + "/das/" +  das_source + "-" + res_inst_id_1 + "/";

            // define DAS Source
            var nds = new DASSource({name: track_label, uri: curi});
            var knownSpace = thisB.knownSpace;

            // validate space
            if (!knownSpace) {
                alert("Can't confirm track-addition to an uninit browser.");
                return;
            }

            var tsm = Math.max(knownSpace.min, (knownSpace.min + knownSpace.max - 100) / 2)|0;
            var testSegment = new DASSegment(knownSpace.chr, tsm, Math.min(tsm + 99, knownSpace.max));

            // define features
            nds.features(testSegment, {}, function(features) {

                var nameExtractPattern = new RegExp('/([^/]+)/?$');
                var match = nameExtractPattern.exec(nds.uri);
                if (match) {
                    nds.name = match[1];
                }

                tryAddDASxSources(nds);

                return;
            });

            /**
             * Add DAS x Sources
             * @param nds
             * @param retry
             */
            function tryAddDASxSources(nds, retry) {

                console.log("nds.name", nds.name);

                var uri = nds.uri;
                if (retry) {
                    var match = /(.+)\/[^\/]+\/?/.exec(uri);
                    if (match) {
                        uri = match[1] + '/sources';
                    }
                }
                function sqfail() {
                    if (!retry) {
                        return tryAddDASxSources(nds, true);
                    } else {
                        return drawTrack(nds);
                    }
                }

                new DASRegistry(uri, {credentials: nds.credentials}).sources(
                    function(sources) {
                        if (!sources || sources.length == 0) {
                            return sqfail();
                        }

                        var fs = null;
                        if (sources.length == 1) {
                            fs = sources[0];
                        } else {
                            for (var i = 0; i < sources.length; ++i) {
                                if (sources[i].uri === nds.uri) {
                                    fs = sources[i];
                                    break;
                                }
                            }
                        }

                        var coordsDetermined = false, quantDetermined = false;

                        console.log("fs", fs);

                        if (fs) {
                            nds.name = fs.name;
                            nds.desc = fs.desc;
                            if (fs.maxbins) {
                                nds.maxbins = true;
                            } else {
                                nds.maxbins = false;
                            }
                            if (fs.capabilities) {
                                nds.capabilities = fs.capabilities;
                            }
                            quantDetermined = true

                            if (fs.coords && fs.coords.length == 1) {
                                var coords = fs.coords[0];
                                if (coordsMatch(coords, thisB.coordSystem)) {
                                    coordsDetermined = true;
                                } else if (thisB.chains) {
                                    for (var k in thisB.chains) {
                                        if (coordsMatch(coords, thisB.chains[k].coords)) {
                                            nds.mapping = k;
                                            coordsDetermined = true;
                                        }
                                    }
                                }
                            }

                        }
                        return drawTrack(nds, coordsDetermined, quantDetermined);
                    },
                    function() {
                        return sqfail();
                    }
                );
            }

            /**
             * Draw new track in the swimming lane
             * @param nds
             * @param coordsDetermined
             * @param quantDetermined
             * @param quantIrrelevant
             */
            var drawTrack = function(nds, coordsDetermined, quantDetermined, quantIrrelevant) {

                console.log("name", nds.name);
                dataToFinalize = nds;


                var m = '__default__'; // coordinate system
                if (m != '__default__') {
                    dataToFinalize.mapping = m;
                } else {
                    dataToFinalize.mapping = undefined;
                }
                thisB.sources.push(dataToFinalize);
                thisB.makeTier(dataToFinalize);
            }

        });
    }
}