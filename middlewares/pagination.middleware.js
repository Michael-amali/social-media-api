const Paginate = (model)=>{
    return async (req, res, next)=>{
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        if(!page || !limit){
            return next();
        }
    
        const startIndex = (page - 1)*limit;
        const endIndex = page*limit;
    
        
        const results = {};
        if(endIndex < await model.countDocuments().exec() ){
            results.next = {
                page: page + 1,
                limit: limit
            }
        }
     
        if(startIndex > 0){
            results.previous = {
                page: page - 1,
                limit: limit
            }
        }
    
        // const resultUser = users.slice(startIndex, endIndex);
        // the skip() method will decide where to start from and the limit() method will be where to end. To sort use .sort({username: -1})
        results.paginatedData = await model.find().limit(limit).skip(startIndex).exec();
        // saving paginated results on the response object
        res.paginatedResult = results;
        return next();
    }


}

module.exports = {
    Paginate: Paginate
}
