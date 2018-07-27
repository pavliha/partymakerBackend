/* eslint-disable radix */
const Party = use('App/Models/Party')
const Picture = use('App/Models/Picture')
const Address = use('App/Models/Address')

class PartyController {

  async index({ request }) {
    const { cursor } = request.all()

    const { total } = (await Party.query().count('* as total'))[0] // count parties

    const parties = await Party
      .query()
      .with('admin')
      .with('address')
      .where('id', '>', parseInt(cursor) || 1)
      .limit(10)
      .orderBy('updated_at', 'DESC')
      .fetch()

    return {
      status: 200,
      cursor,
      total,
      data: parties
    }
  }

  // noinspection JSUnusedGlobalSymbols
  async store({ request, auth }) {
    const {
      title,
      type,
      address,
      district,
      pictures,
      telegram_url: telegramUrl,
      description,
      startTime,
      people_max: peopleMax,
      people_min: peopleMin,
      privateParty,
    } = request.all()

    const addressModel = await Address.create({
      address: address.address,
      district,
      lng: address.lng,
      lat: address.lat,
      placeId: address.placeId,
    })

    const imagePromises = pictures.map(async picture => (await Picture.create({ url: picture })).id)
    const images = await Promise.all(imagePromises)

    const party = await Party.create({
      title,
      type,
      status: 'сбор участников',
      admin_id: auth.current.user.id,
      address_id: addressModel.id,
      primary_picture: images[0],
      telegram_url: telegramUrl,
      startTime,
      description,
      people_max: peopleMax,
      people_min: peopleMin,
      privateParty,
    })

    await party.pictures().attach(images)

    return {
      status: 200,
      message: `${title} created`,
      success: true
    }
  }

  async show({ request, auth, params }) {

    const party = await Party
      .query()
      .with('admin')
      .with('address')
      .where('id', params.id)
      .first()

    return {
      status: 200,
      data: party
    }
  }
}

module.exports = PartyController

