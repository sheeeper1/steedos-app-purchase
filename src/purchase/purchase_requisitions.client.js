if(!Steedos.isMobile()){
    var loadRecordFromOdata;

    loadRecordFromOdata = function (template, object_name, record_id) {
        var expand, object, record, selectFields;
        template.record.set({});
        object = Creator.getObject(object_name);
        selectFields = Creator.objectOdataSelectFields(object);
        expand = Creator.objectOdataExpandFields(object);
        if (object_name === "space_users") {
            expand = expand.replace(/\bcompany_ids\b/, "company_ids($select=name,admins)");
        }
        record = Creator.odata.get(object_name, record_id, selectFields, expand);
        return template.record.set(record);
    };
    Template.creator_view.onCreated(function () {
        console.log("Template.creator_view.onCreated...customer...");
        var self = this;
        var onAddRelatedFormSuccess;
        this.onAddRelatedFormSuccess = onAddRelatedFormSuccess = function (formType, result) {
            console.log("onAddRelatedFormSuccess...customer...");
            loadRecordFromOdata(self, Session.get("object_name"), Session.get("record_id"));
        }
        AutoForm.hooks({
            creatorAddRelatedForm: {
                onSuccess: onAddRelatedFormSuccess
            }
        }, false);
        AutoForm.hooks({
            creatorCellEditForm: {
                onSuccess: onAddRelatedFormSuccess
            }
        }, false);
        self.originalODataDeleteFun = Creator.odata["delete"];
        Creator.odata["delete"] = function (object_name, record_id, callback) {
            var newCallback;
            if(record_id === Session.get("record_id")){
                newCallback = callback;
            }
            else{
                newCallback = function(){
                    callback();
                    onAddRelatedFormSuccess();
                }
            }
            self.originalODataDeleteFun(object_name, record_id, newCallback);
        }
    });
    
    Template.creator_view.onDestroyed(function () {
        var self;
        self = this;
        _.each(AutoForm._hooks.creatorAddRelatedForm.onSuccess, function (fn, index) {
            if (fn === self.onAddRelatedFormSuccess) {
                return delete AutoForm._hooks.creatorAddRelatedForm.onSuccess[index];
            }
        });
        _.each(AutoForm._hooks.creatorCellEditForm.onSuccess, function (fn, index) {
            if (fn === self.onAddRelatedFormSuccess) {
                return delete AutoForm._hooks.creatorCellEditForm.onSuccess[index];
            }
        });
        Creator.odata["delete"] = self.originalODataDeleteFun;
    });
}